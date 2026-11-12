# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { StandardSchemaV1 } from '@standard-schema/spec';

type SchemaPath = PropertyKey | PropertyKey[];

type ArgsSchema = StandardSchemaV1<unknown[], unknown[]>;
type InferArgsInput<In extends ArgsSchema> = Extract<StandardSchemaV1.InferInput<In>, unknown[]>;

type ValidatedFunctionOptions<In extends ArgsSchema, Out extends StandardSchemaV1> = {
    input?: In;
    output?: Out;
    inputPath?: SchemaPath;
    outputPath?: SchemaPath;
};

type ValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: InferArgsInput<In>) => StandardSchemaV1.InferOutput<Out>;

type AsyncValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: InferArgsInput<In>) => Promise<StandardSchemaV1.InferOutput<Out>>;

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

type FunctionSchemaOptions<
    In extends ArgsSchema,
    Out extends StandardSchemaV1,
    Schema extends StandardSchemaV1 = StandardSchemaV1
> = {
    trials?: FunctionTrial<InferArgsInput<In>, Schema>[];
} & ValidatedFunctionOptions<In, Out>;

interface StandardSchemaKind extends SchemaKind {
    readonly Schema: StandardSchemaV1<unknown, this["Output"]>;
}
```

These functions are members of every object created by [`createSchemaUtils`](./adapter.md#createschemautils). The versions documented here are the library-neutral ones (from `standardAdapter`): they accept any Standard Schema, throw [`SchemaValidationError`](./error.md), and `functionSchema` returns a plain Standard Schema. The [Zod versions](../zod/function.md) accept Zod schemas, throw `ZodError`, and return Zod schemas. Otherwise the behavior is identical.

# validatedFunction
```typescript
function validatedFunction<
    In extends ArgsSchema = ArgsSchema,
    Out extends StandardSchemaV1 = StandardSchemaV1,
>(func: unknown, options?: ValidatedFunctionOptions<In, Out>): ValidatedFunction<In, Out>
```
Validates that `func` is callable and wraps it so that every call validates the arguments against `input` and the return value against `output`. Throws the adapter's error at call time (not creation time) if validation fails, with each issue's path prefixed by `inputPath` or `outputPath` as appropriate. Throws the adapter's error immediately (before returning the wrapper) if `func` is not callable. Throws an [`AsyncSchemaError`](./error.md) at call time if `input` or `output` validates asynchronously.

If `input` or `output` coerce or transform their values, the original function receives the parsed (output) arguments, and the wrapper returns the parsed (output) return value.

Errors thrown by the function itself (including validation errors from schemas it uses internally) are rethrown unchanged.

## Parameters
**Direct**
- `func` (`unknown`): The value to validate and wrap.
- `options` (`ValidatedFunctionOptions<In, Out>`, optional): Configuration for input/output validation.
  - `input` (`In`, optional): A tuple or array schema to validate the function's arguments. If omitted, the arguments are not validated.
  - `output` (`Out`, optional): A schema to validate the function's return value. If omitted, the return value is not validated.
  - `inputPath` (`SchemaPath`, optional): Path prefix prepended to argument validation errors. Defaults to `"args"`.
  - `outputPath` (`SchemaPath`, optional): Path prefix prepended to return value validation errors. Defaults to `"return"`.

**Returned function**
- `...args` (`InferArgsInput<In>`): Arguments forwarded to the original function after input validation.

## Returns
- `ValidatedFunction<In, Out>`: A wrapper function that validates the arguments and return value on every call.

# validatedFunctionAsync
```typescript
function validatedFunctionAsync<
    In extends ArgsSchema = ArgsSchema,
    Out extends StandardSchemaV1 = StandardSchemaV1,
>(func: unknown, options?: ValidatedFunctionOptions<In, Out>): AsyncValidatedFunction<In, Out>
```
Async version of `validatedFunction`. The wrapper validates `input` and `output` asynchronously (so async schemas are supported), and awaits the function's result before validating it, so `func` may be either synchronous or asynchronous. Validation failures and errors thrown by `func` reject the returned `Promise`. A non-callable `func` still throws immediately.

## Parameters
The same as [`validatedFunction`](#validatedfunction).

## Returns
- `AsyncValidatedFunction<In, Out>`: A wrapper function returning a `Promise` of the parsed return value.

# functionSchema
```typescript
function functionSchema<
    In extends ArgsSchema = ArgsSchema,
    Out extends StandardSchemaV1 = StandardSchemaV1,
>(options?: FunctionSchemaOptions<In, Out>): StandardSchemaV1<unknown, ValidatedFunction<In, Out>>
```
Factory that returns a schema which parses any value into a validated wrapper function (as created by [`validatedFunction`](#validatedfunction)). Validation fails with an `invalid_type` issue if the value is not callable.

If `trials` are provided, the function is called once per trial at parse time to check its behavior. Each trial's issues are prefixed with the trial's `id` in the issue path. The function is never called at parse time if `trials` is empty. This is useful for checking overload behavior, but should not be used if the function may have side effects.

## Parameters
**Direct**
- `options` (`FunctionSchemaOptions<In, Out>`, optional): Configuration for input/output validation and trials.
  - `input`, `output`, `inputPath`, `outputPath`: The same as for [`validatedFunction`](#validatedfunction).
  - `trials` (`FunctionTrial<InferArgsInput<In>>[]`, optional): A list of test cases to run against the function at parse time. Defaults to `[]`. Each trial has:
    - `id` (`string`, optional): Identifier used as the first segment of each trial's issue paths. Defaults to `"trial_N"` where `N` is the trial's index.
    - `input` (`InferArgsInput<In>`): The arguments to pass to the function for this trial. These are pre-parse values, so they go through any coercions or transforms in `input`.
    - `outputSchema` (`Schema`, optional): A schema to validate the trial's (parsed) return value against. If omitted, the return value is not checked beyond `output`.
    - `error` (`TrialErrorMode`, optional): Controls whether the trial is expected to throw. Defaults to `"forbid"`.
      - `"forbid"` (default): Any thrown error adds an `"Unexpected Error: ..."` issue.
      - `"allow"`: Thrown errors are silently ignored.
      - `"require"`: If no error is thrown, adds an `"Unexpected Success"` issue. Any thrown error is accepted.
      - A function `(e: unknown) => boolean`: If the function returns `false` for the thrown error, adds an `"Unexpected Error: ..."` issue.
      - `{ require: (e: unknown) => boolean }`: If the function returns `false` for the thrown error, adds an `"Unexpected Error: ..."` issue. Additionally, if no error is thrown, adds an `"Unexpected Success"` issue.

      Errors thrown by the wrapper's own input and output validation are always reported as issues (under the trial `id`) rather than being treated as thrown errors. Any other error, including a validation error thrown from inside the function (for example by another validated function it calls), is treated as a thrown error.
    - `errorStringify` (`(e: unknown) => string`, optional): Custom serializer for unexpected errors used in issue messages. Defaults to `interpretError(e, { multiline: false })` for any value with an `issues` array (as detected by [`hasIssues`](./error.md#hasissues)), which covers errors from any schema library or version and produces a message where each issue and its path is on a single line. Otherwise, defaults to `e.message` for `Error` instances and `String(e)` for all other values.

**Returned schema (parsed function)**
- `...args` (`InferArgsInput<In>`): Arguments forwarded to the original function after input validation.

## Returns
- `StandardSchemaV1<unknown, ValidatedFunction<In, Out>>`: A schema that, when it validates a callable value, produces a wrapped function. For other adapters, this is `ApplySchemaKind<Kind, ValidatedFunction<In, Out>>`.

# functionSchemaAsync
```typescript
function functionSchemaAsync<
    In extends ArgsSchema = ArgsSchema,
    Out extends StandardSchemaV1 = StandardSchemaV1,
>(options?: FunctionSchemaOptions<In, Out>): StandardSchemaV1<unknown, AsyncValidatedFunction<In, Out>>
```
Async version of `functionSchema`. The returned schema validates asynchronously, and parses values into wrappers created by [`validatedFunctionAsync`](#validatedfunctionasync). Trials are awaited one at a time, in order, so their side effects and the order of their issues are predictable. Trial output (including `outputSchema`) may be validated by async schemas.

## Parameters
The same as [`functionSchema`](#functionschema).

## Returns
- `StandardSchemaV1<unknown, AsyncValidatedFunction<In, Out>>`: An asynchronous schema that produces an async wrapped function. For other adapters, this is `ApplySchemaKind<Kind, AsyncValidatedFunction<In, Out>>`.
