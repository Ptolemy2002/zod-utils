# Type Reference

## Core (library-neutral)
These types are defined in `src/core/types.ts` and `src/core/adapter.ts`.

```typescript
import { StandardSchemaV1 } from '@standard-schema/spec';
// interface StandardSchemaV1<Input = unknown, Output = Input> {
//     readonly "~standard": {
//         readonly version: 1;
//         readonly vendor: string;
//         readonly validate: (value: unknown) => StandardSchemaV1.Result<Output> | Promise<StandardSchemaV1.Result<Output>>;
//         readonly types?: { readonly input: Input; readonly output: Output } | undefined;
//     };
// }
// StandardSchemaV1 is re-exported by this library.

type PathSegment = PropertyKey | Readonly<{ key: PropertyKey }>;

type SchemaPath = PropertyKey | PropertyKey[];

type SchemaIssue = Readonly<{
    code?: string;
    message: string;
    path?: ReadonlyArray<PathSegment>;
}>;

type IssueContainer = Readonly<{
    issues: ReadonlyArray<SchemaIssue>;
}>;

type IssueError = Error & IssueContainer;

type ValidationOutcome<O> = {
    readonly value: O;
    readonly issues?: undefined;
} | {
    readonly issues: ReadonlyArray<SchemaIssue>;
};

type InterpretErrorOptions = {
    prefix?: SchemaPath;
    multiline?: boolean;
    includeCode?: boolean;
};

type Validator<O> = (v: unknown) => v is O;
type AsyncValidator = (v: unknown) => Promise<boolean>;

type ValidationResult<O> = {
    success: true;
    value: O;
    error?: never;
} | {
    success: false;
    value?: never;
    error: string;
};

type ValidatorWithErrors<O> = (v: unknown) => ValidationResult<O>;
type AsyncValidatorWithErrors<O> = (v: unknown) => Promise<ValidationResult<O>>;

type ValidateWithErrorsOptions = {
    _throw?: boolean;
} & InterpretErrorOptions;

type ArgsSchema = StandardSchemaV1<unknown[], unknown[]>;
type InferArgsInput<In extends ArgsSchema> = Extract<StandardSchemaV1.InferInput<In>, unknown[]>;
type InferArgsOutput<In extends ArgsSchema> = Extract<StandardSchemaV1.InferOutput<In>, unknown[]>;

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

interface SchemaKind {
    readonly Output: unknown;
    readonly Schema: unknown;
}

type ApplySchemaKind<Kind extends SchemaKind, O> = (Kind & { readonly Output: O })["Schema"];

type SchemaParser<O> = (value: unknown) => ValidationOutcome<O>;
type AsyncSchemaParser<O> = (value: unknown) => Promise<ValidationOutcome<O>>;

type SchemaAdapter<
    Schema extends StandardSchemaV1 = StandardSchemaV1,
    Err extends IssueError = IssueError,
    Kind extends SchemaKind = SchemaKind,
> = {
    readonly name: string;
    isSchema(value: unknown): value is Schema;
    isError(err: unknown): err is Err;
    createError(issues: ReadonlyArray<SchemaIssue>): Err;
    createSchema<O>(parse: SchemaParser<O>): ApplySchemaKind<Kind, O>;
    createAsyncSchema<O>(parse: AsyncSchemaParser<O>): ApplySchemaKind<Kind, O>;
};

// The object returned by createSchemaUtils (see docs/core/adapter.md).
type SchemaUtils<Schema, Err, Kind> = ReturnType<typeof createSchemaUtils<Schema, Err, Kind>>;

interface StandardSchemaKind extends SchemaKind {
    readonly Schema: StandardSchemaV1<unknown, this["Output"]>;
}
```

## Zod
These types are defined in `src/zod/types.ts` and `src/zod/adapter.ts`. Most are aliases of the core types, kept for compatibility.

```typescript
import { ZodAny, ZodOptional, ZodPipe, ZodSafeParseResult, ZodTransform, ZodType } from 'zod';

/** @deprecated The Zod utilities now accept any `ZodType`. */
type ZodSafeParseable<O> = { safeParse: (data: unknown) => ZodSafeParseResult<O>; };

type ZodValidator<O> = Validator<O>;
type ZodValidationResult<O> = ValidationResult<O>;
type ZodValidatorWithErrors<O> = ValidatorWithErrors<O>;
type InterpretZodErrorOptions = InterpretErrorOptions;
type ZodValidateWithErrorsOptions = ValidateWithErrorsOptions;

type MaybeZodOptional<ZT extends ZodType> = ZT | ZodOptional<ZT>;

type ZodPath = SchemaPath;
type InterpretableZodIssue = SchemaIssue;
type InterpretableZodError = IssueContainer;

type ZodArgsSchema = ZodType & ArgsSchema;

type ZodFunctionParseOptions<In extends ZodArgsSchema, Out extends ZodType> = ValidatedFunctionOptions<In, Out>;
type ZodFunctionSchemaOptions<In extends ZodArgsSchema, Out extends ZodType> = FunctionSchemaOptions<In, Out, ZodType>;

interface ZodSchemaKind extends SchemaKind {
    readonly Schema: ZodPipe<ZodAny, ZodTransform<this["Output"], any>>;
}
```
