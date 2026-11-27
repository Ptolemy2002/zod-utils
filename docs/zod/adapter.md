# Type Reference
The following is a reference to types relevant to the values listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodAny, ZodError, ZodPipe, ZodTransform } from 'zod';
import { $ZodError, $ZodType } from 'zod/v4/core';

interface ZodSchemaKind extends SchemaKind {
    readonly Schema: ZodPipe<ZodAny, ZodTransform<this["Output"], any>>;
}
```

# zodAdapter
```typescript
const zodAdapter: SchemaAdapter<$ZodType, ZodError | $ZodError, ZodSchemaKind>
```
The [`SchemaAdapter`](../core/adapter.md#schemaadapter) for Zod. It accepts Zod schemas (including `zod/mini` and core schemas, through `$ZodType`), throws `ZodError`, and creates schemas with `z.any().transform(...)`, so the schemas returned by `zodFunctionSchema` can be nested inside other Zod schemas.

## Properties
- `name`: `"Zod"`.
- `isSchema(value: unknown) => value is $ZodType`: Returns `true` for instances of `$ZodType`, which includes classic, `zod/mini` and core schemas.
- `isError`: [`isZodError`](./typeGuards.md).
- `createError(issues: ReadonlyArray<SchemaIssue>) => ZodError`: Creates a `ZodError`. Issues without a `code` get the code `"custom"`, and `{ key }` path segments are normalized to plain keys.
- `createSchema` / `createAsyncSchema`: Return `z.any().transform(...)` schemas that add the parser's issues to the transform context on failure. Schemas from `createAsyncSchema` must be parsed with `parseAsync` / `safeParseAsync`.
- `mayTransform(schema: StandardSchemaV1) => boolean`: Inspects a Zod schema (classic, `zod/mini` or core), including nested schemas, and returns `true` if it may change the value it validates. That is the case if it contains a transform, a codec, `z.preprocess`, coercion (`z.coerce.*`), a default, prefault or catch, `.readonly()`, an overwrite check (such as `.trim()`, `.toLowerCase()` or `.overwrite()`), a function, promise or `z.success` schema, or a schema type it does not recognize. Refinements never count as transforms. Returns `true` for schemas from other libraries.

  Object schemas that strip unknown keys (the default for `z.object`) are not counted as transforms, even though their output omits keys that are not in the shape and is a new object.

# zodUtils
```typescript
const zodUtils: SchemaUtils<$ZodType, ZodError | $ZodError, ZodSchemaKind>
```
The result of [`createSchemaUtils(zodAdapter)`](../core/adapter.md#createschemautils). Its members are also exported individually with a `zod` prefix. The exceptions are `zodValidate` and `zodValidateWithErrors`: for compatibility, they also accept any object with a `safeParse` method (see [validate.md](./validate.md)), so they are separate functions rather than `zodUtils.validate` and `zodUtils.validateWithErrors`.

| `zodUtils` member | Export | Docs |
|---|---|---|
| `validate` | `zodValidate` | [validate.md](./validate.md) |
| `validateAsync` | `zodValidateAsync` | [validate.md](./validate.md) |
| `validateWithErrors` | `zodValidateWithErrors` | [validate.md](./validate.md) |
| `validateWithErrorsAsync` | `zodValidateWithErrorsAsync` | [validate.md](./validate.md) |
| `validatedFunction` | `zodValidatedFunction` | [function.md](./function.md) |
| `validatedFunctionAsync` | `zodValidatedFunctionAsync` | [function.md](./function.md) |
| `functionSchema` | `zodFunctionSchema` | [function.md](./function.md) |
| `functionSchemaAsync` | `zodFunctionSchemaAsync` | [function.md](./function.md) |

# Aliases
The following functions do not depend on the schema library. They are exported under their original Zod names for compatibility:

- `interpretZodError`: The same function as [`interpretError`](../core/interpret.md#interpreterror).
- `interpretZodIssue`: The same function as [`interpretIssue`](../core/interpret.md#interpretissue).
- `prefixZodIssuePath`: The same function as [`prefixIssuePath`](../core/path.md#prefixissuepath).
