import { createSchemaUtils, SchemaAdapter, SchemaKind } from "src/core/adapter";
import { isSchemaValidationError, SchemaValidationError } from "src/core/error";
import { StandardSchemaV1, ValidationOutcome } from "src/core/types";

/** The schema type created by the library-neutral adapter: a plain Standard Schema object. */
export interface StandardSchemaKind extends SchemaKind {
    readonly Schema: StandardSchemaV1<unknown, this["Output"]>;
}

export const STANDARD_SCHEMA_VENDOR = "@ptolemy2002/zod-utils";

export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
    if ((typeof value !== "object" && typeof value !== "function") || value === null) return false;
    const props = (value as { "~standard"?: unknown })["~standard"];
    return typeof props === "object" && props !== null && typeof (props as { validate?: unknown }).validate === "function";
}

function createStandardSchema<O>(
    validate: (value: unknown) => ValidationOutcome<O> | Promise<ValidationOutcome<O>>
): StandardSchemaV1<unknown, O> {
    return {
        "~standard": {
            version: 1,
            vendor: STANDARD_SCHEMA_VENDOR,
            validate: validate as StandardSchemaV1.Props<unknown, O>["validate"],
        },
    };
}

/**
 * The library-neutral adapter. It accepts any Standard Schema (Zod, Valibot, ArkType, ...),
 * throws `SchemaValidationError`, and creates plain Standard Schema objects.
 */
export const standardAdapter: SchemaAdapter<StandardSchemaV1, SchemaValidationError, StandardSchemaKind> = {
    name: "Standard Schema",
    isSchema: isStandardSchema,
    isError: isSchemaValidationError,
    createError: (issues) => new SchemaValidationError(issues),
    createSchema: (parse) => createStandardSchema(parse),
    createAsyncSchema: (parse) => createStandardSchema(parse),
};

export const standardUtils = createSchemaUtils(standardAdapter);

export const {
    validate,
    validateAsync,
    validateWithErrors,
    validateWithErrorsAsync,
    validatedFunction,
    validatedFunctionAsync,
    functionSchema,
    functionSchemaAsync,
} = standardUtils;
