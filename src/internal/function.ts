import isCallable from "is-callable";
import type { SchemaAdapter } from "../core/adapter";
import { hasIssues } from "../core/error";
import { interpretError } from "../core/interpret";
import { issuePathStartsWith, normalizeIssuePath, prefixIssuePath } from "../core/path";
import {
    ArgsSchema, FunctionSchemaOptions, FunctionTrial, SchemaIssue, SchemaPath,
    StandardSchemaV1, ValidatedFunctionOptions, ValidationOutcome
} from "../core/types";
import { standardValidate, standardValidateAsync } from "./standardValidate";

type AnyAdapter = SchemaAdapter<any, any, any>;
type AnyFunction = (...args: unknown[]) => unknown;
type Paths = { inputPath: SchemaPath; outputPath: SchemaPath };

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

// Validation helpers that throw the adapter's error with the issues prefixed.
function checked<O>(adapter: AnyAdapter, outcome: ValidationOutcome<O>, prefix: SchemaPath): O {
    if (outcome.issues) throw adapter.createError(prefixIssues(outcome.issues, prefix));
    return outcome.value;
}

export function validatedFunction(
    adapter: AnyAdapter,
    func: unknown,
    { input, output, inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH }: ValidatedFunctionOptions<ArgsSchema, StandardSchemaV1> = {}
): AnyFunction {
    assertCallable(adapter, func);

    return (...args) => {
        const parsedArgs = input ? checked(adapter, standardValidate(input, args), inputPath) : args;
        // Errors thrown by the function itself propagate unchanged.
        const result = func(...parsedArgs);
        return output ? checked(adapter, standardValidate(output, result), outputPath) : result;
    };
}

export function validatedFunctionAsync(
    adapter: AnyAdapter,
    func: unknown,
    { input, output, inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH }: ValidatedFunctionOptions<ArgsSchema, StandardSchemaV1> = {}
): (...args: unknown[]) => Promise<unknown> {
    assertCallable(adapter, func);

    return async (...args) => {
        const parsedArgs = input ? checked(adapter, await standardValidateAsync(input, args), inputPath) : args;
        // The function may be sync or async. Its resolved value is what gets validated.
        const result = await func(...parsedArgs);
        return output ? checked(adapter, await standardValidateAsync(output, result), outputPath) : result;
    };
}

type ResolvedTrial = {
    id: string;
    requiresError: boolean;
    isExpectedError: (err: unknown) => boolean;
    errorStringify: (err: unknown) => string;
};

function resolveTrial(adapter: AnyAdapter, trial: FunctionTrial<unknown[]>, index: number): ResolvedTrial {
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
            if (adapter.isError(err) && hasIssues(err)) return interpretError(err, { multiline: false });
            if (err instanceof Error) return err.message;
            return String(err);
        }),
    };
}

function withTrialId(id: string, issues: ReadonlyArray<SchemaIssue>): SchemaIssue[] {
    return issues.map(issue => ({ ...issue, path: [id, ...normalizeIssuePath(issue.path)] }));
}

function issuesFromThrow(adapter: AnyAdapter, trial: ResolvedTrial, err: unknown, { inputPath, outputPath }: Paths): SchemaIssue[] {
    // Input/output validation errors produced by the wrapper are reported as-is, under the trial id.
    // The wrapper already indicated whether they came from the input or the output.
    if (adapter.isError(err) && hasIssues(err) && err.issues.every(issue =>
        issuePathStartsWith(issue.path, inputPath) ||
        issuePathStartsWith(issue.path, outputPath)
    )) {
        return withTrialId(trial.id, err.issues);
    }

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

function runTrial(adapter: AnyAdapter, func: AnyFunction, trial: FunctionTrial<unknown[]>, index: number, paths: Paths): SchemaIssue[] {
    const resolved = resolveTrial(adapter, trial, index);

    let output: unknown;
    try {
        output = func(...trial.input);
    } catch (err) {
        return issuesFromThrow(adapter, resolved, err, paths);
    }

    if (resolved.requiresError) return unexpectedSuccess(resolved);
    if (!trial.outputSchema) return [];
    return issuesFromOutput(resolved, standardValidate(trial.outputSchema, output));
}

async function runTrialAsync(adapter: AnyAdapter, func: (...args: unknown[]) => Promise<unknown>, trial: FunctionTrial<unknown[]>, index: number, paths: Paths): Promise<SchemaIssue[]> {
    const resolved = resolveTrial(adapter, trial, index);

    let output: unknown;
    try {
        output = await func(...trial.input);
    } catch (err) {
        return issuesFromThrow(adapter, resolved, err, paths);
    }

    if (resolved.requiresError) return unexpectedSuccess(resolved);
    if (!trial.outputSchema) return [];
    return issuesFromOutput(resolved, await standardValidateAsync(trial.outputSchema, output));
}

type AnyFunctionSchemaOptions = FunctionSchemaOptions<ArgsSchema, StandardSchemaV1>;

export function functionSchema(
    adapter: AnyAdapter,
    { trials = [], inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH, ...options }: AnyFunctionSchemaOptions = {}
) {
    return adapter.createSchema((value): ValidationOutcome<AnyFunction> => {
        if (!isCallable(value)) return { issues: notCallableIssues(value) };

        const func = validatedFunction(adapter, value, { inputPath, outputPath, ...options });
        // The function is never called when there are no trials, since
        // functions with side effects would be problematic to test.
        const issues = trials.flatMap((trial, i) => runTrial(adapter, func, trial, i, { inputPath, outputPath }));

        return issues.length > 0 ? { issues } : { value: func };
    });
}

export function functionSchemaAsync(
    adapter: AnyAdapter,
    { trials = [], inputPath = DEFAULT_INPUT_PATH, outputPath = DEFAULT_OUTPUT_PATH, ...options }: AnyFunctionSchemaOptions = {}
) {
    return adapter.createAsyncSchema(async (value): Promise<ValidationOutcome<(...args: unknown[]) => Promise<unknown>>> => {
        if (!isCallable(value)) return { issues: notCallableIssues(value) };

        const func = validatedFunctionAsync(adapter, value, { inputPath, outputPath, ...options });

        // Trials run one at a time, in order, so that side effects and issue order are predictable.
        const issues: SchemaIssue[] = [];
        for (const [i, trial] of trials.entries()) {
            issues.push(...await runTrialAsync(adapter, func, trial, i, { inputPath, outputPath }));
        }

        return issues.length > 0 ? { issues } : { value: func };
    });
}
