import { ZodOptional, ZodSafeParseResult, ZodType } from 'zod';
import { $ZodFunctionArgs, $ZodFunctionOut } from 'zod/v4/core';

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

export type InterpretZodErrorOptions = {
    prefix?: ZodPath;
    multiline?: boolean;
    includeCode?: boolean;
};

export type ZodValidateWithErrorsOptions = {
    _throw?: boolean;
} & InterpretZodErrorOptions;

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

export type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    input?: In;
    output?: Out;
    inputPath?: ZodPath;
    outputPath?: ZodPath;
};

export type TrialErrorMode =
    | "allow"
    | "forbid"
    | "require"
    | ((e: unknown) => boolean)
    | { require: (e: unknown) => boolean };

export type FunctionTrial<Input extends unknown[]> = {
    id?: string;
    input: Input;
    outputSchema?: ZodType;
    error?: TrialErrorMode;
    errorStringify?: (e: unknown) => string;
};