import { ZodOptional, ZodSafeParseResult, ZodType } from 'zod';
import { $ZodType } from 'zod/v4/core';
import * as t from 'src/core/types';

// Most Zod types are now aliases of the library-neutral types in `core`.
// They are kept so that existing code continues to compile.

/**
 * Accepted by `zodValidate` and `zodValidateWithErrors` for compatibility. Every other Zod utility
 * requires a Zod schema. See PENDING_BREAKING_CHANGES.md.
 */
export type ZodSafeParseable<O> = { safeParse: (data: unknown) => ZodSafeParseResult<O>; };

export type ZodValidator<O> = t.Validator<O>;
export type ZodValidationResult<O> = t.ValidationResult<O>;
export type ZodValidatorWithErrors<O> = t.ValidatorWithErrors<O>;
export type InterpretZodErrorOptions = t.InterpretErrorOptions;
export type ZodValidateWithErrorsOptions = t.ValidateWithErrorsOptions;

export type MaybeZodOptional<ZT extends ZodType> = ZT | ZodOptional<ZT>;

export type ZodPath = t.SchemaPath;
export type InterpretableZodIssue = t.SchemaIssue;
export type InterpretableZodError = t.IssueContainer;

/** A Zod schema that validates a function's argument list (e.g. a `z.tuple` or `z.array`). */
export type ZodArgsSchema = $ZodType & t.ArgsSchema;

export type ZodFunctionParseOptions<In extends ZodArgsSchema, Out extends $ZodType> = t.ValidatedFunctionOptions<In, Out>;
export type ZodFunctionSchemaOptions<In extends ZodArgsSchema, Out extends $ZodType> = t.FunctionSchemaOptions<In, Out, $ZodType>;
