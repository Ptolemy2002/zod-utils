import z, { ZodAny, ZodError, ZodPipe, ZodTransform } from "zod";
import { $ZodError, $ZodIssue, $ZodType } from "zod/v4/core";
import { AsyncSchemaParser, createSchemaUtils, SchemaAdapter, SchemaKind } from "src/core/adapter";
import { interpretError, interpretIssue } from "src/core/interpret";
import { normalizeIssuePath, prefixIssuePath } from "src/core/path";
import { isStandardSchema } from "src/core/standard";
import { SchemaIssue, StandardSchemaV1 } from "src/core/types";
import * as v from "src/internal/validate";
import { isZodError } from "src/zod/typeGuards";
import { ZodSafeParseable, ZodValidateWithErrorsOptions, ZodValidator, ZodValidatorWithErrors } from "src/zod/types";

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

// `$ZodType` (rather than the classic `ZodType`) so that `zod/mini` and core schemas are accepted too.
export const zodAdapter: SchemaAdapter<$ZodType, ZodError | $ZodError, ZodSchemaKind> = {
    name: "Zod",
    isSchema: (value): value is $ZodType => value instanceof $ZodType,
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
    validateAsync: zodValidateAsync,
    validateWithErrorsAsync: zodValidateWithErrorsAsync,
    validatedFunction: zodValidatedFunction,
    validatedFunctionAsync: zodValidatedFunctionAsync,
    functionSchema: zodFunctionSchema,
    functionSchemaAsync: zodFunctionSchemaAsync,
} = zodUtils;

// Workaround (see PENDING_BREAKING_CHANGES.md): `zodValidate` and `zodValidateWithErrors` have always
// accepted any object with a `safeParse` method, not only Zod schemas. Such objects are wrapped in a
// Standard Schema so that these two functions stay compatible.
function toStandardSchema<O>(p: ZodSafeParseable<O>): StandardSchemaV1<unknown, O> {
    if (isStandardSchema(p)) return p as StandardSchemaV1<unknown, O>;

    return {
        "~standard": {
            version: 1,
            vendor: "zod",
            validate: (value) => {
                const result = p.safeParse(value);
                return result.success ? { value: result.data } : { issues: result.error.issues };
            },
        },
    };
}

export function zodValidate<O>(p: ZodSafeParseable<O>): ZodValidator<O> {
    return v.validate(toStandardSchema(p));
}

export function zodValidateWithErrors<O>(p: ZodSafeParseable<O>, options?: ZodValidateWithErrorsOptions): ZodValidatorWithErrors<O> {
    return v.validateWithErrors(zodAdapter, toStandardSchema(p), options);
}

// These do not depend on the adapter. The Zod names are kept for compatibility.
export const interpretZodError = interpretError;
export const interpretZodIssue = interpretIssue;
export const prefixZodIssuePath = prefixIssuePath;
