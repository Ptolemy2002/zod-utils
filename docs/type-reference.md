# Type Reference

```typescript
import { ZodOptional, ZodSafeParseResult, ZodType } from 'zod';
import { $ZodFunctionArgs, $ZodFunctionOut } from 'zod/v4/core';

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

type MaybeZodOptional<ZT extends ZodType> = ZT | ZodOptional<ZT>;

type ZodPath = PropertyKey | PropertyKey[];

type InterpretableZodIssue = Readonly<{
    code?: string;
    message: string;
    path?: PropertyKey[];
}>;

type InterpretableZodError = Readonly<{
    issues: InterpretableZodIssue[];
}>;

type InterpretZodErrorOptions = {
    prefix?: ZodPath;
    multiline?: boolean;
    includeCode?: boolean;
};

type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
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
