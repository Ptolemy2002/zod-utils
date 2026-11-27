import isCallable from "is-callable";
import type { SchemaAdapter } from "src/core/adapter";
import { hasIssues } from "src/core/error";
import { interpretError } from "src/core/interpret";
import { getFunctionValidation } from "src/core/functionValidation";
import { normalizeIssuePath, prefixIssuePath } from "src/core/path";
import {
    ArgsSchema, FunctionSchemaOptions, FunctionTrial, FunctionValidationFlags, SchemaIssue, SchemaPath,
    StandardSchemaV1, ValidatedFunctionOptions, ValidationOutcome
} from "src/core/types";
import { standardValidate, standardValidateAsync } from "src/internal/standardValidate";

type AnyAdapter = SchemaAdapter<any, any, any>;
type AnyFunction = (...args: unknown[]) => unknown;

const DEFAULT_INPUT_PATH = "args";
const DEFAULT_OUTPUT_PATH = "return";

function notCallableIssues(value: unknown): SchemaIssue[] {
    const issue = {
        code: "invalid_type",
        expected: "function",
        message: `Expected a callable function, but received ${typeof value}`,
        path: [],
    };

    return [issue];
}

function prefixIssues(issues: ReadonlyArray<SchemaIssue>, prefix: SchemaPath): SchemaIssue[] {
    return issues.map(issue => prefixIssuePath(issue, prefix));
}

function assertCallable(adapter: AnyAdapter, func: unknown): asserts func is AnyFunction {
    if (!isCallable(func)) throw adapter.createError(notCallableIssues(func));
}

// Errors thrown by a wrapper's own input/output validation, mapped to the wrapper that threw them.
// Trials use this to tell those errors apart from errors thrown by the wrapped function, without
// relying on the adapter's error type guard (the function may throw the same type of error).
const wrapperErrors = new WeakMap<object, { wrapper: object; issues: ReadonlyArray<SchemaIssue> }>();

/** Returns the issues of `err` if it was thrown by `wrapper`'s own input/output validation. */
function wrapperIssues(wrapper: object, err: unknown): ReadonlyArray<SchemaIssue> | undefined {
    if (typeof err !== "object" || err === null) return undefined;
    const entry = wrapperErrors.get(err);
    return entry?.wrapper === wrapper ? entry.issues : undefined;
}

// Returns the parsed value, or throws the adapter's error with the issues prefixed.
function checked<O>(adapter: AnyAdapter, wrapper: object, outcome: ValidationOutcome<O>, prefix: SchemaPath): O {
    if (!outcome.issues) return outcome.value;

    const issues = prefixIssues(outcome.issues, prefix);
    const err = adapter.createError(issues);
    wrapperErrors.set(err, { wrapper, issues });
    throw err;
}

type AnyFunctionOptions = ValidatedFunctionOptions<ArgsSchema, StandardSchemaV1>;
type ValidationFlagsGetter = () => Readonly<FunctionValidationFlags>;

// Trials always validate both the input and the output, regardless of the global flags,
// since they are explicit checks of the function's behavior.
const ALWAYS_VALIDATE: FunctionValidationFlags = Object.freeze({ input: true, output: true });
const alwaysValidate: ValidationFlagsGetter = () => ALWAYS_VALIDATE;

/**
 * Returns whether a schema should run on a call, given whether validation of its side is enabled.
 * When validation is disabled, a schema still runs if it may transform the value, since skipping it
 * would change what the function receives or returns. That check is done once, on first need.
 */
function validationGate(adapter: AnyAdapter, schema: StandardSchemaV1 | undefined) {
    let transforms: boolean | undefined;

    return (enabled: boolean): boolean => {
        if (!schema) return false;
        if (enabled) return true;
        transforms ??= adapter.mayTransform?.(schema) ?? true;
        return transforms;
    };
}

function createWrapper(
    adapter: AnyAdapter,
    func: AnyFunction,
    { input, output, inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH }: AnyFunctionOptions,
    flags: ValidationFlagsGetter
): AnyFunction {
    const runInput = validationGate(adapter, input);
    const runOutput = validationGate(adapter, output);

    const wrapper: AnyFunction = (...args) => {
        // The flags are read on every call, so changes to them affect existing wrappers.
        const { input: validateInput, output: validateOutput } = flags();
        const parsedArgs = runInput(validateInput) ? checked(adapter, wrapper, standardValidate(input!, args), inputPath) : args;
        // Errors thrown by the function itself propagate unchanged.
        const result = func(...parsedArgs);
        return runOutput(validateOutput) ? checked(adapter, wrapper, standardValidate(output!, result), outputPath) : result;
    };

    return wrapper;
}

function createAsyncWrapper(
    adapter: AnyAdapter,
    func: AnyFunction,
    { input, output, inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH }: AnyFunctionOptions,
    flags: ValidationFlagsGetter
): (...args: unknown[]) => Promise<unknown> {
    const runInput = validationGate(adapter, input);
    const runOutput = validationGate(adapter, output);

    const wrapper = async (...args: unknown[]): Promise<unknown> => {
        const { input: validateInput, output: validateOutput } = flags();
        const parsedArgs = runInput(validateInput) ? checked(adapter, wrapper, await standardValidateAsync(input!, args), inputPath) : args;
        // The function may be sync or async. Its resolved value is what gets validated.
        const result = await func(...parsedArgs);
        return runOutput(validateOutput) ? checked(adapter, wrapper, await standardValidateAsync(output!, result), outputPath) : result;
    };

    return wrapper;
}

export function validatedFunction(adapter: AnyAdapter, func: unknown, options: AnyFunctionOptions = {}): AnyFunction {
    assertCallable(adapter, func);
    return createWrapper(adapter, func, options, getFunctionValidation);
}

export function validatedFunctionAsync(
    adapter: AnyAdapter,
    func: unknown,
    options: AnyFunctionOptions = {}
): (...args: unknown[]) => Promise<unknown> {
    assertCallable(adapter, func);
    return createAsyncWrapper(adapter, func, options, getFunctionValidation);
}

type ResolvedTrial = {
    id: string;
    requiresError: boolean;
    isExpectedError: (err: unknown) => boolean;
    errorStringify: (err: unknown) => string;
};

function resolveTrial(trial: FunctionTrial<unknown[]>, index: number): ResolvedTrial {
    const { error } = trial;

    return {
        id: trial.id ?? `trial_${index}`,
        requiresError: error === "require" || (typeof error === "object" && error !== null),
        isExpectedError: (err) => {
            if (error === "allow" || error === "require") return true;
            if (error === undefined || error === "forbid") return false;
            if (typeof error === "function") return error(err);
            return error.require(err);
        },
        errorStringify: trial.errorStringify ?? ((err) => {
            // Structural, so it works for any schema library and any version of it.
            if (hasIssues(err)) return interpretError(err, { multiline: false });
            if (err instanceof Error) return err.message;
            return String(err);
        }),
    };
}

function withTrialId(id: string, issues: ReadonlyArray<SchemaIssue>): SchemaIssue[] {
    return issues.map(issue => ({ ...issue, path: [id, ...normalizeIssuePath(issue.path)] }));
}

function issuesFromThrow(wrapper: object, trial: ResolvedTrial, err: unknown): SchemaIssue[] {
    // Input/output validation errors produced by the wrapper are reported as-is, under the trial id.
    // The wrapper already prefixed them to indicate whether they came from the input or the output.
    const issues = wrapperIssues(wrapper, err);
    if (issues) return withTrialId(trial.id, issues);

    if (trial.isExpectedError(err)) return [];

    return [{
        code: "custom",
        message: `Unexpected Error: ${trial.errorStringify(err)}`,
        path: [trial.id],
    }];
}

function unexpectedSuccess(trial: ResolvedTrial): SchemaIssue[] {
    return [{ code: "custom", message: "Unexpected Success", path: [trial.id] }];
}

function issuesFromOutput(trial: ResolvedTrial, outcome: ValidationOutcome<unknown>): SchemaIssue[] {
    return outcome.issues ? withTrialId(trial.id, outcome.issues) : [];
}

function runTrial(func: AnyFunction, trial: FunctionTrial<unknown[]>, index: number): SchemaIssue[] {
    const resolved = resolveTrial(trial, index);

    let output: unknown;
    try {
        output = func(...trial.input);
    } catch (err) {
        return issuesFromThrow(func, resolved, err);
    }

    if (resolved.requiresError) return unexpectedSuccess(resolved);
    if (!trial.outputSchema) return [];
    return issuesFromOutput(resolved, standardValidate(trial.outputSchema, output));
}

async function runTrialAsync(func: (...args: unknown[]) => Promise<unknown>, trial: FunctionTrial<unknown[]>, index: number): Promise<SchemaIssue[]> {
    const resolved = resolveTrial(trial, index);

    let output: unknown;
    try {
        output = await func(...trial.input);
    } catch (err) {
        return issuesFromThrow(func, resolved, err);
    }

    if (resolved.requiresError) return unexpectedSuccess(resolved);
    if (!trial.outputSchema) return [];
    return issuesFromOutput(resolved, await standardValidateAsync(trial.outputSchema, output));
}

type AnyFunctionSchemaOptions = FunctionSchemaOptions<ArgsSchema, StandardSchemaV1>;

export function functionSchema(
    adapter: AnyAdapter,
    { trials = [], ...options }: AnyFunctionSchemaOptions = {}
) {
    return adapter.createSchema((value): ValidationOutcome<AnyFunction> => {
        if (!isCallable(value)) return { issues: notCallableIssues(value) };

        const func = createWrapper(adapter, value, options, getFunctionValidation);
        // The function is never called when there are no trials, since
        // functions with side effects would be problematic to test.
        if (trials.length === 0) return { value: func };

        const trialFunc = createWrapper(adapter, value, options, alwaysValidate);
        const issues = trials.flatMap((trial, i) => runTrial(trialFunc, trial, i));

        return issues.length > 0 ? { issues } : { value: func };
    });
}

export function functionSchemaAsync(
    adapter: AnyAdapter,
    { trials = [], ...options }: AnyFunctionSchemaOptions = {}
) {
    return adapter.createAsyncSchema(async (value): Promise<ValidationOutcome<(...args: unknown[]) => Promise<unknown>>> => {
        if (!isCallable(value)) return { issues: notCallableIssues(value) };

        const func = createAsyncWrapper(adapter, value, options, getFunctionValidation);
        if (trials.length === 0) return { value: func };

        const trialFunc = createAsyncWrapper(adapter, value, options, alwaysValidate);

        // Trials run one at a time, in order, so that side effects and issue order are predictable.
        const issues: SchemaIssue[] = [];
        for (const [i, trial] of trials.entries()) {
            issues.push(...await runTrialAsync(trialFunc, trial, i));
        }

        return issues.length > 0 ? { issues } : { value: func };
    });
}
