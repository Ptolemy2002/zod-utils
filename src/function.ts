import z, { string, ZodArray, ZodError, ZodType, ZodUnknown } from "zod";
import { $ZodFunctionArgs, $ZodFunctionOut } from "zod/v4/core";
import { isZodError } from "./typeGuards";
import { prefixZodIssuePath } from "./prefixIssuePath";
import { issuePathStartsWith } from "./issuePathStartsWith";
import isCallable from "is-callable";
import { interpretZodError } from "./interpret";
import { ZodPath } from "./types";

export type TrialErrorMode =
    | "allow"
    | "forbid"
    | "require"
    | ((e: unknown) => boolean)
    | { require: (e: unknown) => boolean };

export type FunctionTrial<Input extends unknown[]> = {
    id?: string;
    input: Input;
    outputSchema?: ZodType;
    error?: TrialErrorMode;
    errorStringify?: (e: unknown) => string;
};

export type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    input?: In;
    output?: Out;
    inputPath?: ZodPath;
    outputPath?: ZodPath;
};

export type ZodFunctionSchemaOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    trials?: FunctionTrial<z.infer<In>>[];
} & ZodFunctionParseOptions<In, Out>;

export function zodValidatedFunction<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown,
>(
    func: unknown,
    {
        inputPath="args", outputPath="return",

        input=z.array(z.unknown()) as unknown as In,
        output=z.unknown() as unknown as Out
    }:  ZodFunctionParseOptions<In, Out>={}
) {
    if (!isCallable(func)) {
        throw new ZodError([{
            message: `Expected a callable function, but received ${typeof func}`,
            path: [],
            code: "invalid_type",
            expected: "function"
        }]);
    }

    const functionFactory = z.function({ input, output });
    const wrappedFunction = (setReachedCaller: (v: boolean) => void, setFinishedCall: (v: boolean) => void, ...args: z.infer<In>) => {
        setReachedCaller(true);
        const result = func(...args);
        setFinishedCall(true);
        return result;
    };

    return (...args: z.infer<In>) => {
        // This is how we will differentiate between argument and
        // parameter validation errors
        let reachedCaller = false;
        let finishedCall = false;

        try {
            const implementedFunction = functionFactory.implement(
                (
                    (...args: z.infer<In>) => wrappedFunction(
                        (v) => (reachedCaller = v),
                        (v) => (finishedCall = v),
                        ...args
                    )
                ) as any
            );

            return implementedFunction(...args as any) as z.infer<Out>;
        } catch (e: unknown) {
            if (isZodError(e)) {
                if (!reachedCaller || finishedCall) e = new ZodError(e.issues.map(i => prefixZodIssuePath(i, reachedCaller ? outputPath : inputPath)));
            }

            throw e;
        } finally {
            // Reset reachedCaller and finishedCall for the next call
            reachedCaller = false;
            finishedCall = false;
        }
    }
}

export function zodFunctionSchema<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown
>({trials=[], inputPath="args", outputPath="return", ...options}: ZodFunctionSchemaOptions<In, Out> = {}) {
    // Transform the input value using zodFunctionParse
    // so that this schema can be used to validate functions
    return z.any().transform((v, ctx) => {
        try {
            const result = zodValidatedFunction(v, {
                inputPath, outputPath,
                ...options
            });

            // That zodValidatedFunction call guarantees that this is a function.
            // We will not call it if there are no trials,
            // as functions with side effects would be problematic to test.
            if (trials.length > 0) {
                trials.forEach((trial, i) => {
                    const id = trial.id ?? `trial_${i}`;

                    const {
                        outputSchema=z.unknown(),
                        error,
                        errorStringify=(e) => {
                            if (isZodError(e)) return interpretZodError(e, { multiline: false });
                            if (e instanceof Error) return e.message;
                            return String(e);
                        }
                    } = trial;

                    const requiresError = error === "require" || (typeof error === "object" && error !== null);
                    const isExpectedError = (err: unknown): boolean => {
                        if (error === "allow" || error === "require") return true;
                        if (error === undefined || error === "forbid") return false;
                        if (typeof error === "function") return error(err);
                        return error.require(err);
                    };

                    try {
                        const output = result(...trial.input);

                        if (requiresError) {
                            ctx.addIssue({
                                code: "custom",
                                message: "Unexpected Success",
                                path: [id],
                            });

                            return;
                        }

                        const { success: outputSuccess, error: outputError } = outputSchema.safeParse(output);
                        if (!outputSuccess) {
                            // Indicate the trial where the error occurred to each issue.
                            // The fact that the error is in the output is already indicated,
                            // courtesy of the wrapper zodValidatedFunction provides.
                            outputError.issues.forEach(issue => ctx.addIssue({
                                ...issue,
                                path: [id, ...issue.path]
                            }));
                        }
                    } catch (err: unknown) {
                        if (isZodError(err)) {
                            if (err.issues.every(issue =>
                                issuePathStartsWith(issue.path, inputPath) ||
                                issuePathStartsWith(issue.path, outputPath)
                            )) {
                                // Indicate the trial where the error occurred to each issue.
                                // The fact that the error is in either the input or output is
                                // already indicated, courtesy of the wrapper zodValidatedFunction provides.
                                err.issues.forEach(issue => ctx.addIssue({
                                    ...issue,
                                    path: [id, ...issue.path]
                                }));

                                return;
                            }
                        }

                        if (!isExpectedError(err)) {
                            ctx.addIssue({
                                code: "custom",
                                message: `Unexpected Error: ${errorStringify(err)}`,
                                path: [id],
                            });
                        }
                    }
                });
            }

            return result;
        } catch (e: unknown) {
            if (isZodError(e)) {
                e.issues.forEach(issue => ctx.addIssue(issue as Parameters<typeof ctx.addIssue>[0]));
            }

            return z.NEVER;
        }
    });
}