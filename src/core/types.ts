import type { StandardSchemaV1 } from "@standard-schema/spec";

export type { StandardSchemaV1 };

/** A single segment of an issue path, as allowed by the Standard Schema spec. */
export type PathSegment = PropertyKey | Readonly<{ key: PropertyKey }>;

/** A path used as a prefix or for comparisons. A single key is treated as a one-element path. */
export type SchemaPath = PropertyKey | PropertyKey[];

/**
 * A validation issue. This is a superset of `StandardSchemaV1.Issue` that also allows
 * an optional `code` (which libraries like Zod provide).
 */
export type SchemaIssue = Readonly<{
    code?: string;
    message: string;
    path?: ReadonlyArray<PathSegment>;
}>;

/** Anything that carries a list of issues (a failure result, or an error such as `ZodError`). */
export type IssueContainer = Readonly<{
    issues: ReadonlyArray<SchemaIssue>;
}>;

/** An `Error` that carries a list of issues. */
export type IssueError = Error & IssueContainer;

/** The result of running a validation: either the parsed value or a list of issues. */
export type ValidationOutcome<O> = {
    readonly value: O;
    readonly issues?: undefined;
} | {
    readonly issues: ReadonlyArray<SchemaIssue>;
};

export type InterpretErrorOptions = {
    prefix?: SchemaPath;
    multiline?: boolean;
    includeCode?: boolean;
};

export type Validator<O> = (v: unknown) => v is O;
export type AsyncValidator = (v: unknown) => Promise<boolean>;

export type ValidationResult<O> = {
    success: true;
    value: O;
    error?: never;
} | {
    success: false;
    value?: never;
    error: string;
};

export type ValidatorWithErrors<O> = (v: unknown) => ValidationResult<O>;
export type AsyncValidatorWithErrors<O> = (v: unknown) => Promise<ValidationResult<O>>;

export type ValidateWithErrorsOptions = {
    _throw?: boolean;
} & InterpretErrorOptions;

/** A schema that validates a function's argument list. */
export type ArgsSchema = StandardSchemaV1<unknown[], unknown[]>;

/** The pre-parse argument list accepted by an `ArgsSchema`. */
export type InferArgsInput<In extends ArgsSchema> = Extract<StandardSchemaV1.InferInput<In>, unknown[]>;
/** The parsed argument list produced by an `ArgsSchema`. */
export type InferArgsOutput<In extends ArgsSchema> = Extract<StandardSchemaV1.InferOutput<In>, unknown[]>;

export type ValidatedFunctionOptions<In extends ArgsSchema, Out extends StandardSchemaV1> = {
    input?: In;
    output?: Out;
    inputPath?: SchemaPath;
    outputPath?: SchemaPath;
};

export type ValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: InferArgsInput<In>) => StandardSchemaV1.InferOutput<Out>;

export type AsyncValidatedFunction<In extends ArgsSchema, Out extends StandardSchemaV1> =
    (...args: InferArgsInput<In>) => Promise<StandardSchemaV1.InferOutput<Out>>;

export type TrialErrorMode =
    | "allow"
    | "forbid"
    | "require"
    | ((e: unknown) => boolean)
    | { require: (e: unknown) => boolean };

export type FunctionTrial<Input extends unknown[], Schema extends StandardSchemaV1 = StandardSchemaV1> = {
    id?: string;
    input: Input;
    outputSchema?: Schema;
    error?: TrialErrorMode;
    errorStringify?: (e: unknown) => string;
};

export type FunctionSchemaOptions<
    In extends ArgsSchema,
    Out extends StandardSchemaV1,
    Schema extends StandardSchemaV1 = StandardSchemaV1
> = {
    trials?: FunctionTrial<InferArgsInput<In>, Schema>[];
} & ValidatedFunctionOptions<In, Out>;
