import * as v from "valibot";
import z, { ZodError } from "zod";
import {
    AsyncSchemaError, functionSchema, functionSchemaAsync, isStandardSchema, SchemaValidationError,
    standardAdapter, standardUtils, STANDARD_SCHEMA_VENDOR, StandardSchemaV1, validate, validateAsync,
    validatedFunction, validatedFunctionAsync, validateWithErrors, validateWithErrorsAsync
} from "src/index";
import { expectError, expectZodErrorStructure } from "../utils";

// These tests use Valibot to show that the library-neutral utilities work with any
// Standard Schema library. The trial logic is covered in depth in test/zod/function.test.ts,
// since every adapter shares the same implementation.

const lowercaseMessage = "Must be lowercase";
const uppercaseMessage = "Must be uppercase";
const lowercase = v.pipe(v.string(), v.check(s => s === s.toLowerCase(), lowercaseMessage));
const uppercase = v.pipe(v.string(), v.check(s => s === s.toUpperCase(), uppercaseMessage));
const lowercaseAsync = v.pipeAsync(v.string(), v.checkAsync(async s => s === s.toLowerCase(), lowercaseMessage));
const uppercaseAsync = v.pipeAsync(v.string(), v.checkAsync(async s => s === s.toUpperCase(), uppercaseMessage));

const toUpper = (s: string) => s.toUpperCase();
const toLower = (s: string) => s.toLowerCase();

function standardValidateSync<O>(schema: StandardSchemaV1<unknown, O>, value: unknown) {
    const result = schema["~standard"].validate(value);
    if (result instanceof Promise) throw new Error("Expected a synchronous result");
    return result;
}

describe("standardAdapter", () => {
    it("identifies Standard Schemas from any library", () => {
        expect(isStandardSchema(lowercase)).toBe(true);
        expect(isStandardSchema(z.string())).toBe(true);
        expect(standardAdapter.isSchema(lowercase)).toBe(true);
        expect(standardUtils.isSchema(lowercase)).toBe(true);
        expect(isStandardSchema(null)).toBe(false);
        expect(isStandardSchema("schema")).toBe(false);
        expect(isStandardSchema({ "~standard": null })).toBe(false);
        expect(isStandardSchema({ "~standard": { validate: "nope" } })).toBe(false);
    });

    it("creates and identifies SchemaValidationErrors", () => {
        const err = standardAdapter.createError([{ message: "Bad" }]);
        expect(err).toBeInstanceOf(SchemaValidationError);
        expect(standardUtils.isError(err)).toBe(true);
        expect(standardUtils.isError(new ZodError([]))).toBe(false);
    });
});

describe("validate", () => {
    it("returns whether a Valibot schema accepts the value", () => {
        expect(validate(lowercase)("hello")).toBe(true);
        expect(validate(lowercase)("HELLO")).toBe(false);
    });

    it("throws an AsyncSchemaError for async schemas", () => {
        expect(() => validate(lowercaseAsync)("hello")).toThrow(AsyncSchemaError);
    });

    it("does not leave an unhandled rejection behind when an abandoned async validation rejects", async () => {
        const rejecting: StandardSchemaV1 = {
            "~standard": { version: 1, vendor: "test", validate: () => Promise.reject(new Error("rejected")) },
        };

        const onUnhandled = jest.fn();
        process.on("unhandledRejection", onUnhandled);

        try {
            expect(() => validate(rejecting)("value")).toThrow(AsyncSchemaError);
            await new Promise(resolve => setTimeout(resolve, 0));
            expect(onUnhandled).not.toHaveBeenCalled();
        } finally {
            process.off("unhandledRejection", onUnhandled);
        }
    });
});

describe("validateAsync", () => {
    it("works with async schemas", async () => {
        await expect(validateAsync(lowercaseAsync)("hello")).resolves.toBe(true);
        await expect(validateAsync(lowercaseAsync)("HELLO")).resolves.toBe(false);
    });

    it("works with sync schemas", async () => {
        await expect(validateAsync(lowercase)("HELLO")).resolves.toBe(false);
    });
});

describe("validateWithErrors", () => {
    it("returns the parsed value on success", () => {
        expect(validateWithErrors(v.pipe(v.string(), v.transform(s => s.length)))("abc")).toEqual({ success: true, value: 3 });
    });

    it("returns an interpreted error on failure", () => {
        const result = validateWithErrors(v.object({ field: lowercase }))({ field: "HELLO" });
        expect(result.success).toBe(false);
        expectZodErrorStructure(result.error!, [{ message: lowercaseMessage, path: ["field"] }]);
    });

    it("throws a SchemaValidationError when _throw is true", () => {
        expectError(() => validateWithErrors(lowercase, { _throw: true })("HELLO"), SchemaValidationError, (e) => {
            expectZodErrorStructure(e, [{ message: lowercaseMessage, path: ["(root)"] }]);
        });
    });
});

describe("validateWithErrorsAsync", () => {
    it("returns the result of an async schema", async () => {
        await expect(validateWithErrorsAsync(lowercaseAsync)("hello")).resolves.toEqual({ success: true, value: "hello" });

        const result = await validateWithErrorsAsync(lowercaseAsync, { prefix: "value" })("HELLO");
        expectZodErrorStructure(result.error!, [{ message: lowercaseMessage, path: ["value"] }]);
    });

    it("rejects with a SchemaValidationError when _throw is true", async () => {
        await expect(validateWithErrorsAsync(lowercaseAsync, { _throw: true })("HELLO")).rejects.toBeInstanceOf(SchemaValidationError);
    });
});

describe("validatedFunction", () => {
    const options = { input: v.tuple([lowercase]), output: uppercase };

    it("validates arguments and return value with Valibot schemas", () => {
        const func = validatedFunction(toUpper, options);
        const result: string = func("hello");
        expect(result).toBe("HELLO");

        // @ts-expect-error The argument must be a string
        expect(() => func(42)).toThrow(SchemaValidationError);
    });

    it("prefixes input and output issues", () => {
        expectError(() => validatedFunction(toUpper, options)("HELLO"), SchemaValidationError, (e) => {
            expectZodErrorStructure(e, [{ message: lowercaseMessage, path: ["args", 0] }]);
        });

        expectError(() => validatedFunction(toLower, options)("hello"), SchemaValidationError, (e) => {
            expectZodErrorStructure(e, [{ message: uppercaseMessage, path: ["return"] }]);
        });
    });

    it("throws a SchemaValidationError if the value is not callable", () => {
        expectError(() => validatedFunction(42), SchemaValidationError, (e) => {
            expectZodErrorStructure(e, [{ message: "Expected a callable function, but received number", path: ["(root)"] }]);
        });
    });

    it("rethrows errors thrown by the function unchanged", () => {
        const err = new Error("inner");
        expect(() => validatedFunction(() => { throw err; })()).toThrow(err);
    });

    it("throws an AsyncSchemaError when used with async schemas", () => {
        expect(() => validatedFunction(toUpper, { input: v.tupleAsync([lowercaseAsync]) })("hello")).toThrow(AsyncSchemaError);
    });
});

describe("validatedFunctionAsync", () => {
    const options = { input: v.tupleAsync([lowercaseAsync]), output: uppercaseAsync };

    it("validates async schemas and awaits the function's result", async () => {
        const func = validatedFunctionAsync(async (s: string) => s.toUpperCase(), options);
        const result: Promise<string> = func("hello");
        await expect(result).resolves.toBe("HELLO");
    });

    it("works with sync functions and without schemas", async () => {
        await expect(validatedFunctionAsync(toUpper)("hello")).resolves.toBe("HELLO");
    });

    it("rejects with prefixed input and output issues", async () => {
        const inputError = await validatedFunctionAsync(toUpper, options)("HELLO").catch(e => e);
        expect(inputError).toBeInstanceOf(SchemaValidationError);
        expectZodErrorStructure(inputError, [{ message: lowercaseMessage, path: ["args", 0] }]);

        const outputError = await validatedFunctionAsync(toLower, options)("hello").catch(e => e);
        expectZodErrorStructure(outputError, [{ message: uppercaseMessage, path: ["return"] }]);
    });

    it("throws immediately if the value is not callable", () => {
        expect(() => validatedFunctionAsync("nope")).toThrow(SchemaValidationError);
    });
});

describe("functionSchema", () => {
    const schema = functionSchema({
        input: v.tuple([lowercase]),
        output: uppercase,
        trials: [{ id: "basic", input: ["hello"], outputSchema: v.literal("HELLO") }],
    });

    it("creates a Standard Schema", () => {
        expect(isStandardSchema(schema)).toBe(true);
        expect(schema["~standard"].vendor).toBe(STANDARD_SCHEMA_VENDOR);
    });

    it("produces a validated function when the trials pass", () => {
        const result = standardValidateSync(schema, toUpper);
        expect(result.issues).toBeUndefined();
        expect(result.issues ? null : result.value("abc")).toBe("ABC");
    });

    it("reports trial failures and non-callable values as issues", () => {
        expectZodErrorStructure({ issues: standardValidateSync(schema, toLower).issues! }, [
            { message: uppercaseMessage, path: ["basic", "return"] },
        ]);

        expectZodErrorStructure({ issues: standardValidateSync(schema, 42).issues! }, [
            { message: "Expected a callable function, but received number", path: ["(root)"] },
        ]);
    });

    it("validates trial output with outputSchema", () => {
        const s = functionSchema({ trials: [{ id: "t", input: ["a"], outputSchema: uppercase }] });
        expectZodErrorStructure({ issues: standardValidateSync(s, toLower).issues! }, [
            { message: uppercaseMessage, path: ["t"] },
        ]);
    });

    it("can be used inside other code that accepts Standard Schemas", () => {
        expect(validate(schema)(toUpper)).toBe(true);
        expect(validate(schema)(toLower)).toBe(false);
    });
});

describe("functionSchemaAsync", () => {
    const schema = functionSchemaAsync({
        input: v.tupleAsync([lowercaseAsync]),
        output: uppercaseAsync,
        trials: [
            { id: "first", input: ["hello"] },
            { id: "second", input: ["world"], outputSchema: v.literal("WORLD") },
        ],
    });

    it("produces an async validated function when the trials pass", async () => {
        const result = await schema["~standard"].validate(async (s: string) => s.toUpperCase());
        expect(result.issues).toBeUndefined();
        await expect(result.issues ? null : result.value("abc")).resolves.toBe("ABC");
    });

    it("reports issues from every trial, in order", async () => {
        const result = await schema["~standard"].validate(async (s: string) => s.toLowerCase());
        expectZodErrorStructure({ issues: result.issues! }, [
            { message: uppercaseMessage, path: ["first", "return"] },
            { message: uppercaseMessage, path: ["second", "return"] },
        ]);
    });

    it("reports unexpected errors and successes", async () => {
        const s = functionSchemaAsync({ trials: [
            { id: "throws", input: [] },
            { id: "succeeds", input: [], error: "require" },
            { id: "allowed", input: [], error: "allow" },
        ] });

        let calls = 0;
        const result = await s["~standard"].validate(async () => {
            calls++;
            if (calls !== 2) throw new Error("boom");
        });

        expectZodErrorStructure({ issues: result.issues! }, [
            { message: "Unexpected Error: boom", path: ["throws"] },
            { message: "Unexpected Success", path: ["succeeds"] },
        ]);
    });

    it("validates trial output with outputSchema", async () => {
        const s = functionSchemaAsync({ trials: [{ id: "t", input: ["a"], outputSchema: uppercaseAsync }] });
        const result = await s["~standard"].validate(toLower);
        expectZodErrorStructure({ issues: result.issues! }, [{ message: uppercaseMessage, path: ["t"] }]);
    });

    it("reports a non-callable value as an issue", async () => {
        const result = await schema["~standard"].validate(42);
        expect(result.issues).toHaveLength(1);
    });

    it("accepts any function when no options are given", async () => {
        const result = await functionSchemaAsync()["~standard"].validate(toUpper);
        expect(result.issues).toBeUndefined();
    });
});
