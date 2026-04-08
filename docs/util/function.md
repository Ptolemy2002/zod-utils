# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodArray, ZodUnknown } from 'zod';
import { $ZodFunctionArgs, $ZodFunctionOut } from 'zod/v4/core';

type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    input?: In;
    output?: Out;
    inputPath?: PropertyKey | PropertyKey[];
    outputPath?: PropertyKey | PropertyKey[];
};
```

# zodFunctionSchema
```typescript
function zodFunctionSchema<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown
>(options?: ZodFunctionParseOptions<In, Out>): ZodEffects<ZodAny, (...args: z.infer<In>) => z.infer<Out>>
```
Factory that returns a Zod schema which parses any value into a validated wrapper function. When the schema's `.parse()` result is called, it validates the arguments against `input` and the return value against `output`, throwing a `ZodError` with a prefixed path on failure. Throws a `ZodError` at parse time if the value is not callable.

## Parameters
**Direct**
- `options` (`ZodFunctionParseOptions<In, Out>`, optional): Configuration for input/output validation.
  - `input` (`In`, optional): A Zod tuple or array schema to validate the function's arguments. Defaults to `z.array(z.unknown())`.
  - `output` (`Out`, optional): A Zod schema to validate the function's return value. Defaults to `z.unknown()`.
  - `inputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to argument validation errors. Defaults to `"args"`.
  - `outputPath` (`PropertyKey | PropertyKey[]`, optional): Path prefix prepended to return value validation errors. Defaults to `"return"`.

**Returned schema (parsed function)**
- `...args` (`z.infer<In>`): Arguments forwarded to the original function after input validation.

## Returns
- `ZodPipe<z.ZodAny, z.ZodTransform<(...args: z.core.output<In>) => z.core.output<Out>, any>>`: A Zod schema that, when parsed with a callable value, produces a wrapped function. Calling the wrapped function validates its arguments and return value, rethrowing any non-Zod errors unchanged.
