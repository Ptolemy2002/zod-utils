# Type Reference

```typescript
import { ZodOptional, ZodSafeParseResult, ZodType } from 'zod';

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
```
