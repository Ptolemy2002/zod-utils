import { toDotPath } from "zod/v4/core";
import z, { ZodError, ZodType } from "zod";
import { StandardSchemaV1 } from "zod/v4/core/standard-schema.cjs";
import { interpretZodError } from "src/interpret";
import { zodValidate, zodValidateWithErrors } from "src/index";

export const zodAlwaysRejectMessage = "This schema always rejects";

export const zodAlwaysReject = z.string().refine(() => false, { message: zodAlwaysRejectMessage });
export const zodAlwaysRejectNested = z.object({
    nested: z.string().refine(() => false, { message: zodAlwaysRejectMessage }),
});

export const zodAlwaysAccept = z.any();

export type ZodErrorStructure = {
    message: string;
    path?: (PropertyKey | StandardSchemaV1.PathSegment)[];
};

export function zodErrorStructureString(errs: ZodErrorStructure[]): string {
    const lines: string[] = [];

    for (const {message, path} of errs) {
        lines.push("✖ " + message);
        lines.push(`  → at ${toDotPath(path ?? ["(root)"])}`);
    }

    return lines.join("\n");
}

export function expectZodErrorStructure(err: ZodError | string, expected: ZodErrorStructure[]) {
    if (typeof err !== "string") err = interpretZodError(err);
    expect(err).toBe(zodErrorStructureString(expected));
}

type ZodExpectValidationOptions = {
    value?: unknown;
    failed?: boolean;
    expectedMessage?: ZodErrorStructure[] | null;
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