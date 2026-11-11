import * as v from "valibot";
import { interpretError, interpretIssue, StandardSchemaV1 } from "src/index";
import { expectZodErrorStructure, expectZodIssueStructure } from "../utils";

// The Zod-specific behavior (prefixes, multiline, includeCode) is covered in test/zod/interpret.test.ts,
// since interpretZodError is the same function. These tests cover non-Zod issues.
describe("interpretError", () => {
    it("interprets issues from another Standard Schema library (Valibot)", () => {
        const schema = v.object({ nested: v.object({ value: v.string("Must be a string") }) });
        // Valibot's Standard Schema path items are objects with a `key` property.
        const result = schema["~standard"].validate({ nested: { value: 42 } }) as StandardSchemaV1.FailureResult;

        expectZodErrorStructure(interpretError(result), [
            { message: "Must be a string", path: ["nested", "value"] },
        ]);
    });

    it("handles `{ key }` path segments of every key type", () => {
        const sym = Symbol("sym");
        expectZodErrorStructure(interpretError({ issues: [
            { message: "Bad", path: [{ key: "a" }, { key: 0 }, { key: "with space" }, { key: sym }] },
        ] }), [
            { message: "Bad", path: ["a", 0, "with space", sym] },
        ]);
    });

    it("sorts issues by path length", () => {
        const result = interpretError({ issues: [
            { message: "Deep", path: ["a", "b"] },
            { message: "Shallow", path: ["a"] },
        ] });

        expectZodErrorStructure(result, [
            { message: "Shallow", path: ["a"] },
            { message: "Deep", path: ["a", "b"] },
        ]);
    });

    it("does not add a code when the issue has none, even if includeCode is true", () => {
        expectZodErrorStructure(interpretError({ issues: [{ message: "No code" }] }, { includeCode: true }), [
            { message: "No code", path: ["(root)"] },
        ]);
    });
});

describe("interpretIssue", () => {
    it("interprets a single issue", () => {
        expectZodIssueStructure(interpretIssue({ message: "Bad", path: [{ key: "field" }] }), {
            message: "Bad",
            path: ["field"],
        });
    });
});
