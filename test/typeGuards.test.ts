import { isZodError } from "src/typeGuards";
import { ZodError } from "zod";

class TestError extends Error {}

class TestZodError extends Error {
    name = "ZodError";
}

describe("isZodError", () => {
    it("returns false for non-errors", () => {
        expect(isZodError(null)).toBe(false);
        expect(isZodError(undefined)).toBe(false);
        expect(isZodError(123)).toBe(false);
        expect(isZodError("error")).toBe(false);
        expect(isZodError({})).toBe(false);
    });

    it("returns false for non-Zod errors", () => {
        expect(isZodError(new TestError())).toBe(false);
    });

    it("returns false for non-errors with name 'ZodError'", () => {
        expect(isZodError({ name: "ZodError" })).toBe(false);
    });

    it("returns true for ZodError instances", () => {
        expect(isZodError(new ZodError([]))).toBe(true);
    });

    it("returns true for errors with name 'ZodError'", () => {
        expect(isZodError(new TestZodError())).toBe(true);
    });
});