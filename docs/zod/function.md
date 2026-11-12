# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import z, { ZodAny, ZodPipe, ZodTransform } from 'zod';
import { $ZodType } from 'zod/v4/core';

type ZodPath = PropertyKey | PropertyKey[];

type ArgsSchema = StandardSchemaV1<unknown[], unknown[]>;
type ZodArgsSchema = $ZodType & ArgsSchema;

type ZodFunctionParseOptions<In extends ZodArgsSchema, Out extends $ZodType> = {
    input?: In;
    output?: Out;
    inputPath?: ZodPath;
    outputPath?: ZodPath;
};

type TrialErrorMode =
    | "allow"
    | "forbid"
    | "require"
    | ((e: unknown) => boolean)
    | { require: (e: unknown) => boolean };

type FunctionTrial<Input extends unknown[], Schema extends StandardSchemaV1 = StandardSchemaV1> = {
    id?: string;
    input: Input;
    outputSchema?: Schema;
    error?: TrialErrorMode;
    errorStringify?: (e: unknown) => string;
};

type ZodFunctionSchemaOptions<In extends ZodArgsSchema, Out extends $ZodType> = {
    trials?: FunctionTrial<z.input<In>, $ZodType>[];
} & ZodFunctionParseOptions<In, Out>;

type ValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: z.input<In>) => z.output<Out>;

type AsyncValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: z.input<In>) => Promise<z.output<Out>>;
```

These are the Zod versions of the [function utilities](../core/function.md), created by [`zodUtils`](./adapter.md#zodutils). They behave exactly as documented there, with these differences:

- `input`, `output` and trial `outputSchema` must be Zod schemas (classic, `zod/mini` or core). `input` should be a tuple or array schema.
- Validation failures, and non-callable values passed to `zodValidatedFunction`, throw a `ZodError`.
- `zodFunctionSchema` and `zodFunctionSchemaAsync` return Zod schemas (`z.any().transform(...)`), so they can be nested in other Zod schemas. Non-callable values fail with an `invalid_type` issue.

# zodValidatedFunction
```typescript
function zodValidatedFunction<
    In extends ZodArgsSchema = ZodArgsSchema,
    Out extends $ZodType = $ZodType,
>(func: unknown, options?: ZodFunctionParseOptions<In, Out>): ValidatedFunction<In, Out>
```
See [`validatedFunction`](../core/function.md#validatedfunction). The returned function accepts `z.input<In>` and returns `z.output<Out>`.

# zodValidatedFunctionAsync
```typescript
function zodValidatedFunctionAsync<
    In extends ZodArgsSchema = ZodArgsSchema,
    Out extends $ZodType = $ZodType,
>(func: unknown, options?: ZodFunctionParseOptions<In, Out>): AsyncValidatedFunction<In, Out>
```
See [`validatedFunctionAsync`](../core/function.md#validatedfunctionasync). Supports schemas with async refinements and transforms, and async functions.

# zodFunctionSchema
```typescript
function zodFunctionSchema<
    In extends ZodArgsSchema = ZodArgsSchema,
    Out extends $ZodType = $ZodType,
>(options?: ZodFunctionSchemaOptions<In, Out>): ZodPipe<ZodAny, ZodTransform<ValidatedFunction<In, Out>, any>>
```
See [`functionSchema`](../core/function.md#functionschema). Parse the returned schema with `.parse()` / `.safeParse()`. Trial issues are reported in the resulting `ZodError`, with each path starting with the trial's `id`.

# zodFunctionSchemaAsync
```typescript
function zodFunctionSchemaAsync<
    In extends ZodArgsSchema = ZodArgsSchema,
    Out extends $ZodType = $ZodType,
>(options?: ZodFunctionSchemaOptions<In, Out>): ZodPipe<ZodAny, ZodTransform<AsyncValidatedFunction<In, Out>, any>>
```
See [`functionSchemaAsync`](../core/function.md#functionschemaasync). The returned schema must be parsed with `.parseAsync()` / `.safeParseAsync()`. Calling `.parse()` throws.
