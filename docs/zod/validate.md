# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import z, { ZodSafeParseResult } from 'zod';
import { $ZodType } from 'zod/v4/core';

type ZodSafeParseable<O> = { safeParse: (data: unknown) => ZodSafeParseResult<O>; };

type ZodPath = PropertyKey | PropertyKey[];

type ZodValidator<O> = (v: unknown) => v is O;
type AsyncValidator = (v: unknown) => Promise<boolean>;

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
type AsyncValidatorWithErrors<O> = (v: unknown) => Promise<ZodValidationResult<O>>;

type InterpretZodErrorOptions = {
    prefix?: ZodPath;
    multiline?: boolean;
    includeCode?: boolean;
};

type ZodValidateWithErrorsOptions = {
    _throw?: boolean;
} & InterpretZodErrorOptions;
```

These are the Zod versions of the [validation utilities](../core/validate.md), created by [`zodUtils`](./adapter.md#zodutils). They behave exactly as documented there, except that they only accept Zod schemas, and `_throw` throws (or rejects with) a `ZodError`.

For compatibility with earlier versions, `zodValidate` and `zodValidateWithErrors` also accept any object with a `safeParse` method (`ZodSafeParseable`), not only Zod schemas. Objects without a `~standard` property are validated through `safeParse`. This is planned to change in the next major release (see [PENDING_BREAKING_CHANGES.md](../../PENDING_BREAKING_CHANGES.md)).

The synchronous functions throw an [`AsyncSchemaError`](../core/error.md) if the schema has async refinements or transforms. Use the async variants for those schemas.

# zodValidate
```typescript
function zodValidate<O>(p: ZodSafeParseable<O>): ZodValidator<O>
```
See [`validate`](../core/validate.md#validate).

# zodValidateAsync
```typescript
function zodValidateAsync<S extends $ZodType>(schema: S): AsyncValidator
```
See [`validateAsync`](../core/validate.md#validateasync).

# zodValidateWithErrors
```typescript
function zodValidateWithErrors<O>(
    p: ZodSafeParseable<O>,
    options?: ZodValidateWithErrorsOptions,
): ZodValidatorWithErrors<O>
```
See [`validateWithErrors`](../core/validate.md#validatewitherrors). When `options._throw` is `true`, the returned validator throws a `ZodError` with the schema's issues.

# zodValidateWithErrorsAsync
```typescript
function zodValidateWithErrorsAsync<S extends $ZodType>(
    schema: S,
    options?: ZodValidateWithErrorsOptions,
): AsyncValidatorWithErrors<z.output<S>>
```
See [`validateWithErrorsAsync`](../core/validate.md#validatewitherrorsasync). When `options._throw` is `true`, the returned `Promise` rejects with a `ZodError`.
