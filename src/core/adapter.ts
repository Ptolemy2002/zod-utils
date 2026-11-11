import * as fn from "../internal/function";
import * as v from "../internal/validate";
import {
    ArgsSchema, AsyncValidatedFunction, AsyncValidator, AsyncValidatorWithErrors, FunctionSchemaOptions,
    IssueError, SchemaIssue, StandardSchemaV1, ValidatedFunction, ValidatedFunctionOptions,
    ValidateWithErrorsOptions, ValidationOutcome, Validator, ValidatorWithErrors
} from "./types";

/**
 * Describes the schema type a library produces for a given output type. TypeScript has no
 * higher-kinded types, so adapters extend this interface and refer to `this["Output"]` in `Schema`:
 *
 * ```ts
 * interface MySchemaKind extends SchemaKind {
 *     readonly Schema: MyLibSchema<this["Output"]>;
 * }
 * ```
 */
export interface SchemaKind {
    readonly Output: unknown;
    readonly Schema: unknown;
}

/** Resolves the schema type described by `Kind` for the output type `O`. */
export type ApplySchemaKind<Kind extends SchemaKind, O> = (Kind & { readonly Output: O })["Schema"];

/** A function that validates a value and either returns the parsed value or a list of issues. */
export type SchemaParser<O> = (value: unknown) => ValidationOutcome<O>;
export type AsyncSchemaParser<O> = (value: unknown) => Promise<ValidationOutcome<O>>;

/**
 * The contract each supported schema library implements. Validation itself always goes through
 * the Standard Schema interface (`schema["~standard"].validate`), so an adapter only describes
 * what is different per library: its schema type, its error type, and how to build a custom schema.
 *
 * - `Schema`: The library's base schema type. Utilities only accept schemas of this type.
 * - `Err`: The error type the library throws. Must carry an `issues` array.
 * - `Kind`: The type of schema returned by `createSchema` / `createAsyncSchema` (see `SchemaKind`).
 */
export type SchemaAdapter<
    Schema extends StandardSchemaV1 = StandardSchemaV1,
    Err extends IssueError = IssueError,
    Kind extends SchemaKind = SchemaKind,
> = {
    /** A human-readable name for the library. */
    readonly name: string;
    /** Type guard for the library's schemas. */
    isSchema(value: unknown): value is Schema;
    /** Type guard for the library's validation errors. */
    isError(err: unknown): err is Err;
    /** Creates the library's validation error from a list of issues. */
    createError(issues: ReadonlyArray<SchemaIssue>): Err;
    /** Creates a schema of the library's type that runs `parse` synchronously. */
    createSchema<O>(parse: SchemaParser<O>): ApplySchemaKind<Kind, O>;
    /** Creates a schema of the library's type that runs `parse` asynchronously. */
    createAsyncSchema<O>(parse: AsyncSchemaParser<O>): ApplySchemaKind<Kind, O>;
};

/**
 * Builds the full set of utilities for a schema library from its adapter. Each supported library
 * gets its exports from this function, so they all behave identically.
 */
export function createSchemaUtils<
    Schema extends StandardSchemaV1,
    Err extends IssueError,
    Kind extends SchemaKind,
>(adapter: SchemaAdapter<Schema, Err, Kind>) {
    type Out<S extends StandardSchemaV1> = StandardSchemaV1.InferOutput<S>;
    type FnOptions<In extends ArgsSchema, O extends StandardSchemaV1> = ValidatedFunctionOptions<In, O>;
    type SchemaOptions<In extends ArgsSchema, O extends StandardSchemaV1> = FunctionSchemaOptions<In, O, Schema>;

    return {
        adapter,
        isSchema: adapter.isSchema,
        isError: adapter.isError,

        validate<S extends Schema>(schema: S): Validator<Out<S>> {
            return v.validate(schema);
        },

        validateAsync<S extends Schema>(schema: S): AsyncValidator {
            return v.validateAsync(schema);
        },

        validateWithErrors<S extends Schema>(schema: S, options?: ValidateWithErrorsOptions): ValidatorWithErrors<Out<S>> {
            return v.validateWithErrors(adapter, schema, options);
        },

        validateWithErrorsAsync<S extends Schema>(schema: S, options?: ValidateWithErrorsOptions): AsyncValidatorWithErrors<Out<S>> {
            return v.validateWithErrorsAsync(adapter, schema, options);
        },

        validatedFunction<
            In extends Schema & ArgsSchema = Schema & ArgsSchema,
            O extends Schema = Schema,
        >(func: unknown, options?: FnOptions<In, O>): ValidatedFunction<In, O> {
            return fn.validatedFunction(adapter, func, options) as ValidatedFunction<In, O>;
        },

        validatedFunctionAsync<
            In extends Schema & ArgsSchema = Schema & ArgsSchema,
            O extends Schema = Schema,
        >(func: unknown, options?: FnOptions<In, O>): AsyncValidatedFunction<In, O> {
            return fn.validatedFunctionAsync(adapter, func, options) as AsyncValidatedFunction<In, O>;
        },

        functionSchema<
            In extends Schema & ArgsSchema = Schema & ArgsSchema,
            O extends Schema = Schema,
        >(options?: SchemaOptions<In, O>): ApplySchemaKind<Kind, ValidatedFunction<In, O>> {
            return fn.functionSchema(adapter, options as FunctionSchemaOptions<ArgsSchema, StandardSchemaV1>);
        },

        functionSchemaAsync<
            In extends Schema & ArgsSchema = Schema & ArgsSchema,
            O extends Schema = Schema,
        >(options?: SchemaOptions<In, O>): ApplySchemaKind<Kind, AsyncValidatedFunction<In, O>> {
            return fn.functionSchemaAsync(adapter, options as FunctionSchemaOptions<ArgsSchema, StandardSchemaV1>);
        },
    };
}

export type SchemaUtils<
    Schema extends StandardSchemaV1 = StandardSchemaV1,
    Err extends IssueError = IssueError,
    Kind extends SchemaKind = SchemaKind,
> = ReturnType<typeof createSchemaUtils<Schema, Err, Kind>>;
