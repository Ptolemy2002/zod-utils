import { ZodOptional, ZodSafeParseResult, ZodType } from 'zod';

export type ZodSafeParseable<O> = { safeParse: (data: unknown) => ZodSafeParseResult<O>; };

export type ZodValidator<O> = (v: unknown) => v is O;

export type ZodValidationResult<O> = {
    success: true;
    value: O;
    error?: never;
} | {
    success: false;
    value?: never;
    error: string;
};

export type ZodValidatorWithErrors<O> = (v: unknown) => ZodValidationResult<O>;

export type ZodValidateWithErrorsOptions = {
    _throw?: boolean;
    prefix?: string | string[];
};

export type MaybeZodOptional<ZT extends ZodType> = ZT | ZodOptional<ZT>;

export type ZodPath = PropertyKey | PropertyKey[];

export type InterpretableZodIssue = Readonly<{
    code?: string;
    message: string;
    path?: PropertyKey[];
}>;

export type InterpretableZodError = Readonly<{
    issues: InterpretableZodIssue[];
}>;