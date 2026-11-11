# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { StandardSchemaV1 } from '@standard-schema/spec';

type SchemaPath = PropertyKey | PropertyKey[];

type Validator<O> = (v: unknown) => v is O;
type AsyncValidator = (v: unknown) => Promise<boolean>;

type ValidationResult<O> = {
    success: true;
    value: O;
    error?: never;
} | {
    success: false;
    value?: never;
    error: string;
};

type ValidatorWithErrors<O> = (v: unknown) => ValidationResult<O>;
type AsyncValidatorWithErrors<O> = (v: unknown) => Promise<ValidationResult<O>>;

type InterpretErrorOptions = {
    prefix?: SchemaPath;
    multiline?: boolean;
    includeCode?: boolean;
};

type ValidateWithErrorsOptions = {
    _throw?: boolean;
} & InterpretErrorOptions;
```

These functions are members of every object created by [`createSchemaUtils`](./adapter.md#createschemautils). The versions documented here are the library-neutral ones (from `standardAdapter`), which accept any Standard Schema and throw [`SchemaValidationError`](./error.md). The [Zod versions](../zod/validate.md) accept Zod schemas and throw `ZodError`.

The synchronous functions throw an [`AsyncSchemaError`](./error.md) if the schema validates asynchronously (for example, a Zod schema with an async refinement). Use the async variants for those schemas.

# validate
```typescript
function validate<S extends StandardSchemaV1>(schema: S): Validator<StandardSchemaV1.InferOutput<S>>
```
Factory that wraps a schema and returns a simple type predicate. Use this when you need a type guard but do not require an error message on failure.

## Parameters
**Direct**
- `schema` (`S`): The schema to validate against.

**Returned validator**
- `v` (`unknown`): The value to validate.

## Returns
- `Validator<StandardSchemaV1.InferOutput<S>>`: A type predicate that returns `true` when the schema accepts `v`.

# validateAsync
```typescript
function validateAsync<S extends StandardSchemaV1>(schema: S): AsyncValidator
```
Async version of `validate` that supports schemas that validate asynchronously. The returned function resolves to a `boolean`, since a `Promise` cannot be a type predicate.

## Parameters
**Direct**
- `schema` (`S`): The schema to validate against.

**Returned validator**
- `v` (`unknown`): The value to validate.

## Returns
- `AsyncValidator`: A function returning a `Promise` that resolves to `true` when the schema accepts `v`.

# validateWithErrors
```typescript
function validateWithErrors<S extends StandardSchemaV1>(
    schema: S,
    options?: ValidateWithErrorsOptions,
): ValidatorWithErrors<StandardSchemaV1.InferOutput<S>>
```
Factory that wraps a schema and returns a validator that reports success or failure as a `ValidationResult`. On failure the result contains a human-readable error string produced by [`interpretError`](./interpret.md). Throws the adapter's error (here, a `SchemaValidationError`) instead when `options._throw` is `true`.

## Parameters
**Direct**
- `schema` (`S`): The schema to validate against.
- `options` (`ValidateWithErrorsOptions`, optional): Configuration for the returned validator.
  - `_throw` (`boolean`, optional): When `true`, the returned validator throws the adapter's error rather than returning a failure result. Defaults to `false`.
  - `prefix` (`SchemaPath`, optional): Path prefix forwarded to `interpretError`. Defaults to `""`.
  - `multiline` (`boolean`, optional): Forwarded to `interpretError`. Defaults to `true`.
  - `includeCode` (`boolean`, optional): Forwarded to `interpretError`. Defaults to `false`.

**Returned validator**
- `v` (`unknown`): The value to validate.

## Returns
- `ValidatorWithErrors<StandardSchemaV1.InferOutput<S>>`: A function returning a `ValidationResult`. On success, `result.value` holds the parsed output. On failure, `result.error` holds the error string.

# validateWithErrorsAsync
```typescript
function validateWithErrorsAsync<S extends StandardSchemaV1>(
    schema: S,
    options?: ValidateWithErrorsOptions,
): AsyncValidatorWithErrors<StandardSchemaV1.InferOutput<S>>
```
Async version of `validateWithErrors` that supports schemas that validate asynchronously. When `options._throw` is `true`, the returned `Promise` rejects with the adapter's error.

## Parameters
The same as [`validateWithErrors`](#validatewitherrors).

## Returns
- `AsyncValidatorWithErrors<StandardSchemaV1.InferOutput<S>>`: A function returning a `Promise` of a `ValidationResult`.
