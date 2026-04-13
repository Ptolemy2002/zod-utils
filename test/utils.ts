import { toDotPath } from "zod/v4/core";
import z, { ZodType } from "zod";
import { StandardSchemaV1 } from "zod/v4/core/standard-schema.cjs";
import { interpretZodError, interpretZodIssue } from "src/interpret";
import { InterpretableZodError, InterpretableZodIssue, zodValidate, zodValidateWithErrors } from "src/index";

export const zodAlwaysRejectMessage = "This schema always rejects";

export const zodAlwaysReject = z.any().refine(() => false, { message: zodAlwaysRejectMessage });
export const zodAlwaysRejectNested = z.object({
    nested: zodAlwaysReject
});

export const zodAlwaysRejectMultipleMessage1 = "First issue";
export const zodAlwaysRejectMultipleMessage2 = "Second issue";
export const zodAlwaysRejectMultiple = z.any().superRefine((_, ctx) => {
    ctx.addIssue({ code: "custom", message: zodAlwaysRejectMultipleMessage1 });
    ctx.addIssue({ code: "custom", message: zodAlwaysRejectMultipleMessage2 });
});

export const zodAlwaysAccept = z.any();

export const zodAllLowercaseMessage = "String must be all lowercase";
export const zodAllUppercaseMessage = "String must be all uppercase";

export const zodAllLowercase = z.string().refine((s) => s === s.toLowerCase(), { message: zodAllLowercaseMessage });
export const zodAllUppercase = z.string().refine((s) => s === s.toUpperCase(), { message: zodAllUppercaseMessage });

export type ZodIssueStructure = {
    message: string;
    path?: (PropertyKey | StandardSchemaV1.PathSegment)[];
    multiline?: boolean;
};

export function zodIssueStructureString({ multiline=true, ...i}: ZodIssueStructure): string {
    const path = toDotPath(i.path ?? ["(root)"]);

    let result = `✖ ${i.message}\n  → at ${path}`;

    if (!multiline) {
        result = result.replace(/\n\s*→/g, " →");
    }

    return result;
}

export function zodErrorStructureString(errs: ZodIssueStructure[]): string {
    const parts: string[] = [];

    for (const i of errs) {
        parts.push(zodIssueStructureString(i));
    }

    return parts.join("\n");
}

export function expectZodIssueStructure(issue: InterpretableZodIssue |  string, expected: ZodIssueStructure) {
    if (typeof issue !== "string") issue = interpretZodIssue(issue);
    expect(issue).toBe(zodIssueStructureString(expected));
}

export function expectZodErrorStructure(err: InterpretableZodError | string, expected: ZodIssueStructure[]) {
    if (typeof err !== "string") err = interpretZodError(err);
    expect(err).toBe(zodErrorStructureString(expected));
}

export type ZodExpectValidationOptions = {
    value?: unknown;
    failed?: boolean;
    expectedMessage?: ZodIssueStructure[] | null;
};

export function expectZodValidation(zt: ZodType, {value = "some value", failed = false}: Omit<ZodExpectValidationOptions, "expectedMessage"> = {}) {
    const result = zodValidate(zt)(value);
    expect(result).toBe(!failed);
}

export function expectZodValidationWithErrors(zt: ZodType, {value = "some value", failed = false, expectedMessage = null}: ZodExpectValidationOptions = {}) {
    const result = zodValidateWithErrors(zt)(value);
    expect(result.success).toBe(!failed);

    if (result.success) {
        expect(result.value).toBe(value);
    } else if (expectedMessage) {
        expectZodErrorStructure(result.error, expectedMessage);
    }
}

export function expectError<
    T extends new (...args: unknown[]) => Error
>(fn: () => void, errorClass: T, errorValidator?: (error: InstanceType<T>) => void) {
    let error: Error | null = null;

    const capturingFn = () => {
        try {
            fn();
        } catch (e) {
            error = e;
            throw e;
        }
    };

    expect(capturingFn).toThrow(errorClass);
    
    if (errorValidator) {
        errorValidator(error as InstanceType<T>);
    }
}