import { FunctionValidationFlags } from "src/core/types";

const DEFAULT_FUNCTION_VALIDATION: Readonly<FunctionValidationFlags> = Object.freeze({ input: true, output: true });

let currentFlags: Readonly<FunctionValidationFlags> = DEFAULT_FUNCTION_VALIDATION;

/** Returns the current global flags for validated function input and output validation. */
export function getFunctionValidation(): Readonly<FunctionValidationFlags> {
    return currentFlags;
}

/**
 * Updates the global flags for validated function input and output validation. Flags that are
 * omitted keep their current values. Returns the previous flags, so they can be restored later.
 */
export function setFunctionValidation(flags: Partial<FunctionValidationFlags>): Readonly<FunctionValidationFlags> {
    const previous = currentFlags;
    currentFlags = Object.freeze({
        input: flags.input ?? previous.input,
        output: flags.output ?? previous.output,
    });
    return previous;
}

/** Restores the global flags for validated function input and output validation to their defaults (both `true`). */
export function resetFunctionValidation(): void {
    currentFlags = DEFAULT_FUNCTION_VALIDATION;
}
