# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import z from 'zod';
import { ZodArray, ZodType, ZodUnknown } from 'zod';
import { $ZodFunctionArgs, $ZodFunctionOut } from 'zod/v4/core';

type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    input?: In;
    output?: Out;
    inputPath?: PropertyKey | PropertyKey[];
    outputPath?: PropertyKey | PropertyKey[];
};

type TrialErrorMode =
    | "allow"
    | "forbid"
    | "require"
    | ((e: unknown) => boolean)
    | { require: (e: unknown) => boolean };

type FunctionTrial<Input extends unknown[]> = {
    id?: string;
    input: Input;
    outputSchema?: ZodType;
    error?: TrialErrorMode;
    errorStringify?: (e: unknown) => string;
};

type ZodFunctionSchemaOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    trials?: FunctionTrial<z.infer<In>>[];
} & ZodFunctionParseOptions<In, Out>;
```

# zodValidatedFunction
```typescript
function zodValidatedFunction<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown,
>(func: unknown, options?: ZodFunctionParseOptions<In, Out>): (...args: z.infer<In>) => z.infer<Out>
```
Validates that `func` is callable and wraps it so that every call validates arguments against `input` and the return value against `output`. Throws a `ZodError` at call time (not creation time) if validation fails, with each issue's path prefixed by `inputPath` or `outputPath` as appropriate. Throws a `ZodError` immediately (before returning the wrapper) if `func` is not callable.

ZodErrors thrown by the function itself during execution (rather than produced by input/output schema validation) are rethrown unchanged.

## Parameters
**Direct**
- `func` (`unknown`): The value to validate and wrap. Throws a `ZodError` if not callable.
- `options` (`ZodFunctionParseOptions<In, Out>`, optional): Configuration for input/output validation.
  - `input` (`In`, optional): A Zod tuple or array schema to validate the function's arguments. Defaults to `z.array(z.unknown())`.
  - `output` (`Out`, optional): A Zod schema to validate the function's return value. Defaults to `z.unknown()`.
  - `inputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to argument validation errors. Defaults to `"args"`.
  - `outputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to return value validation errors. Defaults to `"return"`.

**Returned function**
- `...args` (`z.infer<In>`): Arguments forwarded to the original function after input validation.

## Returns
- `(...args: z.infer<In>) => z.infer<Out>`: A wrapper function that validates arguments and return value on every call, rethrowing any non-Zod errors and any ZodErrors thrown during execution unchanged.

# zodFunctionSchema
```typescript
function zodFunctionSchema<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown
>(options?: ZodFunctionSchemaOptions<In, Out>): ZodPipe<z.ZodAny, z.ZodTransform<(...args: z.core.output<In>) => z.core.output<Out>, any>>
```
Factory that returns a Zod schema which parses any value into a validated wrapper function. When the schema's `.parse()` result is called, it validates the arguments against `input` and the return value against `output`, throwing a `ZodError` with a prefixed path on failure. Throws a `ZodError` at parse time if the value is not callable.

If `trials` are provided, the function is called once per trial at parse time to validate its behavior. Each trial's issues are prefixed with the trial's `id` in the error path. The function is never called at parse time if `trials` is empty. This is useful for evaluating overload behavior, but should not be used if it is expected that the function may have side effects.

## Parameters
**Direct**
- `options` (`ZodFunctionSchemaOptions<In, Out>`, optional): Configuration for input/output validation and trials.
  - `input` (`In`, optional): A Zod tuple or array schema to validate the function's arguments. Defaults to `z.array(z.unknown())`.
  - `output` (`Out`, optional): A Zod schema to validate the function's return value. Defaults to `z.unknown()`.
  - `inputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to argument validation errors. Defaults to `"args"`.
  - `outputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to return value validation errors. Defaults to `"return"`.
  - `trials` (`FunctionTrial<z.infer<In>>[]`, optional): A list of test cases to run against the function at parse time. Defaults to `[]`. Each trial has:
    - `id` (`string`, optional): Identifier used as the first segment of each trial's issue paths. Defaults to `"trial_N"` where `N` is the trial's index.
    - `input` (`z.infer<In>`): The arguments to pass to the function for this trial.
    - `outputSchema` (`ZodType`, optional): A schema to validate the trial's return value against. Defaults to `z.unknown()`.
    - `error` (`TrialErrorMode`, optional): Controls whether the trial is expected to throw. Defaults to `"forbid"`.
      - `"forbid"` (default): Any thrown error adds an `"Unexpected Error: ..."` issue.
      - `"allow"`: Thrown errors are silently ignored.
      - `"require"`: If no error is thrown, adds an `"Unexpected Success"` issue. Any thrown error is accepted.
      - A function `(e: unknown) => boolean`: If the function returns `false` for the thrown error, adds an `"Unexpected Error: ..."` issue.
      - `{ require: (e: unknown) => boolean }`: If the function returns `false` for the thrown error, adds an `"Unexpected Error: ..."` issue. Additionally, if no error is thrown, adds an `"Unexpected Success"` issue.
    - `errorStringify` (`(e: unknown) => string`, optional): Custom serializer for unexpected errors used in issue messages. Defaults to `interpretZodError` for `ZodError` instances, `e.message` for `Error` instances, and `String(e)` for all other values.

**Returned schema (parsed function)**
- `...args` (`z.infer<In>`): Arguments forwarded to the original function after input validation.

## Returns
- `ZodPipe<z.ZodAny, z.ZodTransform<(...args: z.core.output<In>) => z.core.output<Out>, any>>`: A Zod schema that, when parsed with a callable value, produces a wrapped function. Calling the wrapped function validates its arguments and return value, rethrowing any non-Zod errors unchanged.
