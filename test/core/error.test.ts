import { AsyncSchemaError, hasIssues, isSchemaValidationError, SchemaValidationError } from "src/index";
import { expectZodErrorStructure } from "../utils";

describe("SchemaValidationError", () => {
    it("stores the issues and uses the interpreted issues as the message by default", () => {
        const issues = [{ message: "Bad value", path: ["field"] }];
        const err = new SchemaValidationError(issues);

        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe("SchemaValidationError");
        expect(err.issues).toBe(issues);
        expectZodErrorStructure(err.message, [{ message: "Bad value", path: ["field"] }]);
    });

    it("accepts a custom message", () => {
        expect(new SchemaValidationError([], "custom").message).toBe("custom");
    });
});

describe("isSchemaValidationError", () => {
    it("returns true only for SchemaValidationError instances", () => {
        expect(isSchemaValidationError(new SchemaValidationError([]))).toBe(true);
        expect(isSchemaValidationError(new Error("nope"))).toBe(false);
        expect(isSchemaValidationError({ issues: [] })).toBe(false);
    });
});

describe("hasIssues", () => {
    it("returns true for objects with an array of issues that have string messages", () => {
        expect(hasIssues({ issues: [] })).toBe(true);
        expect(hasIssues({ issues: [{ message: "a" }, { message: "b", path: [] }] })).toBe(true);
        expect(hasIssues(new SchemaValidationError([{ message: "a" }]))).toBe(true);
    });

    it("returns false for anything else", () => {
        expect(hasIssues(null)).toBe(false);
        expect(hasIssues("issues")).toBe(false);
        expect(hasIssues({})).toBe(false);
        expect(hasIssues({ issues: "not an array" })).toBe(false);
        expect(hasIssues({ issues: [null] })).toBe(false);
        expect(hasIssues({ issues: [{ message: 42 }] })).toBe(false);
    });
});

describe("AsyncSchemaError", () => {
    it("has a default message and name", () => {
        const err = new AsyncSchemaError();
        expect(err.name).toBe("AsyncSchemaError");
        expect(err.message).toMatch(/async variant/);
    });
});
