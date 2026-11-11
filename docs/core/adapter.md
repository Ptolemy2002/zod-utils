# Type Reference
The following is a reference to types relevant to the functions and values listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { StandardSchemaV1 } from '@standard-schema/spec';

type SchemaIssue = Readonly<{
    code?: string;
    message: string;
    path?: ReadonlyArray<PathSegment>;
}>;

type IssueError = Error & Readonly<{ issues: ReadonlyArray<SchemaIssue> }>;

type ValidationOutcome<O> = {
    readonly value: O;
    readonly issues?: undefined;
} | {
    readonly issues: ReadonlyArray<SchemaIssue>;
};

interface SchemaKind {
    readonly Output: unknown;
    readonly Schema: unknown;
}

type ApplySchemaKind<Kind extends SchemaKind, O> = (Kind & { readonly Output: O })["Schema"];

type SchemaParser<O> = (value: unknown) => ValidationOutcome<O>;
type AsyncSchemaParser<O> = (value: unknown) => Promise<ValidationOutcome<O>>;

type SchemaAdapter<
    Schema extends StandardSchemaV1 = StandardSchemaV1,
    Err extends IssueError = IssueError,
    Kind extends SchemaKind = SchemaKind,
> = {
    readonly name: string;
    isSchema(value: unknown): value is Schema;
    isError(err: unknown): err is Err;
    createError(issues: ReadonlyArray<SchemaIssue>): Err;
    createSchema<O>(parse: SchemaParser<O>): ApplySchemaKind<Kind, O>;
    createAsyncSchema<O>(parse: AsyncSchemaParser<O>): ApplySchemaKind<Kind, O>;
};

interface StandardSchemaKind extends SchemaKind {
    readonly Schema: StandardSchemaV1<unknown, this["Output"]>;
}
```

# Overview
Every utility in this library validates through the [Standard Schema](https://standardschema.dev) interface (`schema["~standard"].validate`), which is implemented by Zod, Valibot, ArkType, Effect Schema and others. What differs between libraries is described by a `SchemaAdapter`:

- which schemas the utilities accept (`Schema`),
- which error they throw (`Err`, built by `createError`),
- what kind of schema `functionSchema` returns (`Kind`, built by `createSchema` / `createAsyncSchema`).

[`createSchemaUtils`](#createschemautils) turns an adapter into the full set of utilities. The library ships two adapters:

- [`standardAdapter`](#standardadapter): Library-neutral. Its utilities are exported without a prefix (`validate`, `functionSchema`, ...).
- [`zodAdapter`](../zod/adapter.md): Zod. Its utilities are exported with a `zod` prefix (`zodValidate`, `zodFunctionSchema`, ...).

# SchemaAdapter
The contract each supported schema library implements.

## Properties
- `name` (`string`): A human-readable name for the library.
- `isSchema(value: unknown) => value is Schema`: Type guard for the library's schemas.
- `isError(err: unknown) => err is Err`: Type guard for the library's validation errors. Used to tell input/output validation errors apart from other errors during function trials, and to format errors in trial messages.
- `createError(issues: ReadonlyArray<SchemaIssue>) => Err`: Creates the library's validation error. The issues may lack a `code` and may contain `{ key }` path segments, so the adapter should normalize them as needed.
- `createSchema<O>(parse: SchemaParser<O>) => ApplySchemaKind<Kind, O>`: Wraps `parse` in a schema of the library's type. When `parse` returns `{ issues }`, the schema must fail with those issues. Otherwise it must succeed with `value`.
- `createAsyncSchema<O>(parse: AsyncSchemaParser<O>) => ApplySchemaKind<Kind, O>`: The same as `createSchema`, but `parse` is asynchronous.

## SchemaKind
TypeScript cannot express "a schema of output type `O`" generically, so an adapter describes its schema type with an interface that extends `SchemaKind` and refers to `this["Output"]`. `ApplySchemaKind<Kind, O>` substitutes `O` for `Output` and reads `Schema`:

```typescript
interface MyLibSchemaKind extends SchemaKind {
    readonly Schema: MyLibSchema<this["Output"]>;
}

type Example = ApplySchemaKind<MyLibSchemaKind, string>; // MyLibSchema<string>
```

## Adding support for a library
Implement a `SchemaAdapter` and pass it to `createSchemaUtils`. The following is a rough sketch of what an adapter for Valibot could look like (the issue conversion is left out):

```typescript
import * as v from "valibot";
import { createSchemaUtils, normalizeIssuePath, SchemaAdapter, SchemaKind } from "@ptolemy2002/zod-utils";

interface ValibotSchemaKind extends SchemaKind {
    readonly Schema: v.GenericSchema<unknown, this["Output"]>;
}

const valibotAdapter: SchemaAdapter<v.GenericSchema, v.ValiError<v.GenericSchema>, ValibotSchemaKind> = {
    name: "Valibot",
    isSchema: (value): value is v.GenericSchema => typeof value === "object" && value !== null && (value as any).kind === "schema",
    isError: v.isValiError,
    createError: (issues) => new v.ValiError(/* convert issues */),
    createSchema: (parse) => v.pipe(v.unknown(), v.rawTransform(({ dataset, addIssue, NEVER }) => {
        const result = parse(dataset.value);
        if (!result.issues) return result.value;
        for (const issue of result.issues) addIssue({ message: issue.message /* , path */ });
        return NEVER;
    })),
    createAsyncSchema: /* the same with v.pipeAsync and v.rawTransformAsync */,
};

export const valibotUtils = createSchemaUtils(valibotAdapter);
```

# createSchemaUtils
```typescript
function createSchemaUtils<
    Schema extends StandardSchemaV1,
    Err extends IssueError,
    Kind extends SchemaKind,
>(adapter: SchemaAdapter<Schema, Err, Kind>): SchemaUtils<Schema, Err, Kind>
```
Builds the full set of utilities for a schema library from its adapter. Every supported library gets its exports from this function, so they all behave identically.

## Parameters
- `adapter` (`SchemaAdapter<Schema, Err, Kind>`): The adapter for the library.

## Returns
- `SchemaUtils<Schema, Err, Kind>`: An object with the following members. Each accepts only schemas of type `Schema`, and every error it throws is created with `adapter.createError`.
  - `adapter`: The adapter that was passed in.
  - `isSchema`, `isError`: The adapter's type guards.
  - `validate`, `validateAsync`, `validateWithErrors`, `validateWithErrorsAsync`: See [validate.md](./validate.md).
  - `validatedFunction`, `validatedFunctionAsync`, `functionSchema`, `functionSchemaAsync`: See [function.md](./function.md). `functionSchema` and `functionSchemaAsync` return `ApplySchemaKind<Kind, ...>`.

# standardAdapter
```typescript
const standardAdapter: SchemaAdapter<StandardSchemaV1, SchemaValidationError, StandardSchemaKind>
```
The library-neutral adapter. It accepts any Standard Schema, throws [`SchemaValidationError`](./error.md), and creates plain Standard Schema objects whose `vendor` is `STANDARD_SCHEMA_VENDOR` (`"@ptolemy2002/zod-utils"`). These objects can be passed to any utility or third-party code that accepts Standard Schemas, but they cannot be nested inside another library's schemas. Use that library's adapter for that.

`standardUtils` is `createSchemaUtils(standardAdapter)`. Its members are also exported individually: `validate`, `validateAsync`, `validateWithErrors`, `validateWithErrorsAsync`, `validatedFunction`, `validatedFunctionAsync`, `functionSchema` and `functionSchemaAsync`.

# isStandardSchema
```typescript
function isStandardSchema(value: unknown): value is StandardSchemaV1
```
Returns `true` if `value` is an object or function with a `~standard` property that has a `validate` function. This is `standardAdapter.isSchema`.

## Parameters
- `value` (`unknown`): The value to test.

## Returns
- `boolean`: `true` if `value` implements the Standard Schema interface, `false` otherwise.
