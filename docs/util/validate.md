# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type ZodSafeParseable<O> = { safeParse: (data: unknown) => ZodSafeParseResult<O>; };

type ZodValidator<O> = (v: unknown) => v is O;

type ZodValidationResult<O> = {
    success: true;
    value: O;
    error?: never;
} | {
    success: false;
    value?: never;
    error: string;
};

type ZodValidatorWithErrors<O> = (v: unknown) => ZodValidationResult<O>;

type ZodValidateWithErrorsOptions = {
    _throw?: boolean;
    prefix?: string | string[];
};
```

# zodValidate
```typescript
function zodValidate<O>(p: ZodSafeParseable<O>): ZodValidator<O>
```
Factory that wraps a Zod schema (or any `ZodSafeParseable`) and returns a simple type predicate. Use this when you need a type guard but do not require an error message on failure.

## Parameters
**Direct**
- `p` (`ZodSafeParseable<O>`): The schema to validate against.

**Returned validator**
- `v` (`unknown`): The value to validate.

## Returns
- `ZodValidator<O>`: A type predicate `(v: unknown) => v is O` that returns `true` when the schema accepts `v`.

# zodValidateWithErrors
```typescript
function zodValidateWithErrors<O>(
    p: ZodSafeParseable<O>,
    options?: ZodValidateWithErrorsOptions,
): ZodValidatorWithErrors<O>
```
Factory that wraps a Zod schema and returns a validator that reports success or failure as a `ZodValidationResult`. On failure the result contains a human-readable error string produced by [`interpretZodError`](./interpret.md). Throws the raw `ZodError` instead when `options._throw` is `true`.

## Parameters
**Direct**
- `p` (`ZodSafeParseable<O>`): The schema to validate against.
- `options` (`ZodValidateWithErrorsOptions`, optional): Configuration for the returned validator.
  - `_throw` (`boolean`, optional): When `true`, the returned validator throws the `ZodError` rather than returning a failure result. Defaults to `false`.
  - `prefix` (`string | string[]`, optional): Path prefix forwarded to `interpretZodError` for error messages. Defaults to `""`.

**Returned validator**
- `v` (`unknown`): The value to validate.

## Returns
- `ZodValidatorWithErrors<O>`: A function returning a `ZodValidationResult<O>`. On success, `result.value` holds the parsed output. On failure, `result.error` holds the error string (or the `ZodError` is thrown if `_throw` is `true`).
