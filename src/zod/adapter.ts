import z, { ZodAny, ZodError, ZodPipe, ZodTransform, ZodType } from "zod";
import { $ZodError, $ZodIssue } from "zod/v4/core";
import { AsyncSchemaParser, createSchemaUtils, SchemaAdapter, SchemaKind } from "../core/adapter";
import { interpretError, interpretIssue } from "../core/interpret";
import { normalizeIssuePath, prefixIssuePath } from "../core/path";
import { SchemaIssue } from "../core/types";
import { isZodError } from "./typeGuards";

/** The schema type created by the Zod adapter: a `z.any()` piped into a transform. */
export interface ZodSchemaKind extends SchemaKind {
    readonly Schema: ZodPipe<ZodAny, ZodTransform<this["Output"], any>>;
}

function toZodIssue(issue: SchemaIssue): $ZodIssue {
    return { ...issue, code: issue.code ?? "custom", path: normalizeIssuePath(issue.path) } as $ZodIssue;
}

type ZodTransformContext = z.core.$RefinementCtx;

function addIssues(ctx: ZodTransformContext, issues: ReadonlyArray<SchemaIssue>) {
    for (const issue of issues) ctx.addIssue(toZodIssue(issue) as Parameters<ZodTransformContext["addIssue"]>[0]);
}

export const zodAdapter: SchemaAdapter<ZodType, ZodError | $ZodError, ZodSchemaKind> = {
    name: "Zod",
    isSchema: (value): value is ZodType => value instanceof ZodType,
    isError: isZodError,
    createError: (issues) => new ZodError(issues.map(toZodIssue)),

    createSchema: (parse) => z.any().transform((value, ctx) => {
        const result = parse(value);
        if (result.issues) {
            addIssues(ctx, result.issues);
            return z.NEVER;
        }

        return result.value;
    }),

    // An async transform's output type is `Awaited<O>`, so cast back to the declared kind.
    createAsyncSchema: <O>(parse: AsyncSchemaParser<O>) =>
        z.any().transform(async (value, ctx) => {
            const result = await parse(value);
            if (result.issues) {
                addIssues(ctx, result.issues);
                return z.NEVER;
            }

            return result.value;
        }) as unknown as ZodPipe<ZodAny, ZodTransform<O, any>>,
};

export const zodUtils = createSchemaUtils(zodAdapter);

export const {
    validate: zodValidate,
    validateAsync: zodValidateAsync,
    validateWithErrors: zodValidateWithErrors,
    validateWithErrorsAsync: zodValidateWithErrorsAsync,
    validatedFunction: zodValidatedFunction,
    validatedFunctionAsync: zodValidatedFunctionAsync,
    functionSchema: zodFunctionSchema,
    functionSchemaAsync: zodFunctionSchemaAsync,
} = zodUtils;

// These do not depend on the adapter. The Zod names are kept for compatibility.
export const interpretZodError = interpretError;
export const interpretZodIssue = interpretIssue;
export const prefixZodIssuePath = prefixIssuePath;
