import z, { ZodError } from "zod";
import * as zm from "zod/mini";
import {
    AsyncSchemaError, isZodError, zodAdapter, zodFunctionSchema, zodFunctionSchemaAsync, zodUtils,
    zodValidate, zodValidateAsync, zodValidatedFunction, zodValidatedFunctionAsync, zodValidateWithErrors,
    zodValidateWithErrorsAsync, ZodSafeParseable
} from "src/index";
import { expectZodErrorStructure, zodAllLowercase, zodAllLowercaseMessage, zodAllUppercase, zodAllUppercaseMessage } from "../utils";

const asyncLowercase = z.string().refine(async s => s === s.toLowerCase(), { message: zodAllLowercaseMessage });
const asyncUppercase = z.string().refine(async s => s === s.toUpperCase(), { message: zodAllUppercaseMessage });

describe("zodAdapter", () => {
    it("identifies Zod schemas", () => {
        expect(zodAdapter.isSchema(z.string())).toBe(true);
        expect(zodUtils.isSchema({ "~standard": {} })).toBe(false);
    });

    it("uses isZodError as its error guard", () => {
        expect(zodUtils.isError).toBe(isZodError);
    });

    it("creates ZodErrors, defaulting issue codes to 'custom' and normalizing paths", () => {
        const err = zodAdapter.createError([{ message: "Bad", path: [{ key: "a" }, 0] }, { message: "Other", code: "invalid_type" }]);
        expect(err).toBeInstanceOf(ZodError);
        expect(err.issues).toEqual([
            { message: "Bad", code: "custom", path: ["a", 0] },
            { message: "Other", code: "invalid_type", path: [] },
        ]);
    });
});

describe("zod/mini schemas", () => {
    it("are accepted by the adapter and the function utilities", () => {
        const input = zm.tuple([zm.string()]);
        expect(zodAdapter.isSchema(input)).toBe(true);

        const func = zodValidatedFunction((s: string) => s.length, { input, output: zm.number() });
        const result: number = func("abc");
        expect(result).toBe(3);
        expect(() => (func as (v: unknown) => number)(42)).toThrow(ZodError);
    });
});

describe("objects with only a safeParse method", () => {
    // Compatibility workaround; see PENDING_BREAKING_CHANGES.md.
    // A plain object with no `~standard` property, so it can only be validated through `safeParse`.
    const evenNumberSchema = z.number().refine(n => n % 2 === 0, { message: "Must be even" });
    const evenNumber: ZodSafeParseable<number> = { safeParse: (data) => evenNumberSchema.safeParse(data) };

    it("are accepted by zodValidate", () => {
        expect(zodValidate(evenNumber)(2)).toBe(true);
        expect(zodValidate(evenNumber)(3)).toBe(false);
    });

    it("are accepted by zodValidateWithErrors", () => {
        expect(zodValidateWithErrors(evenNumber)(2)).toEqual({ success: true, value: 2 });
        expectZodErrorStructure(zodValidateWithErrors(evenNumber)(3).error!, [{ message: "Must be even", path: ["(root)"] }]);
        expect(() => zodValidateWithErrors(evenNumber, { _throw: true })(3)).toThrow(ZodError);
    });
});

describe("type inference", () => {
    it("infers argument and return types from the schemas", () => {
        const func = zodValidatedFunction((s: string) => s.length, {
            input: z.tuple([z.string()]),
            output: z.number(),
        });

        const result: number = func("abc");
        expect(result).toBe(3);

        // @ts-expect-error The argument must be a string
        expect(() => func(42)).toThrow(ZodError);

        const schema = zodFunctionSchema({ input: z.tuple([z.string()]), output: z.number() });
        const parsed: (s: string) => number = schema.parse((s: string) => s.length);
        expect(parsed("ab")).toBe(2);
    });
});

describe("sync utilities with async Zod schemas", () => {
    it("throw an AsyncSchemaError", () => {
        expect(() => zodValidate(asyncLowercase)("hello")).toThrow(AsyncSchemaError);
        expect(() => zodValidatedFunction((s: string) => s, { input: z.tuple([asyncLowercase]) })("hello")).toThrow(AsyncSchemaError);
    });
});

describe("zodValidateAsync", () => {
    it("supports async refinements", async () => {
        await expect(zodValidateAsync(asyncLowercase)("hello")).resolves.toBe(true);
        await expect(zodValidateAsync(asyncLowercase)("HELLO")).resolves.toBe(false);
    });
});

describe("zodValidateWithErrorsAsync", () => {
    it("returns an interpreted error", async () => {
        const result = await zodValidateWithErrorsAsync(asyncLowercase)("HELLO");
        expectZodErrorStructure(result.error!, [{ message: zodAllLowercaseMessage, path: ["(root)"] }]);
    });

    it("rejects with a ZodError when _throw is true", async () => {
        await expect(zodValidateWithErrorsAsync(asyncLowercase, { _throw: true })("HELLO")).rejects.toBeInstanceOf(ZodError);
    });
});

describe("zodValidatedFunctionAsync", () => {
    const options = { input: z.tuple([asyncLowercase]), output: asyncUppercase };

    it("validates with async schemas and awaits async functions", async () => {
        const func = zodValidatedFunctionAsync(async (s: string) => s.toUpperCase(), options);
        await expect(func("hello")).resolves.toBe("HELLO");
    });

    it("rejects with prefixed ZodErrors", async () => {
        const error = await zodValidatedFunctionAsync((s: string) => s.toLowerCase(), options)("hello").catch(e => e);
        expect(error).toBeInstanceOf(ZodError);
        expectZodErrorStructure(error, [{ message: zodAllUppercaseMessage, path: ["return"] }]);
    });
});

describe("zodFunctionSchemaAsync", () => {
    const schema = zodFunctionSchemaAsync({
        input: z.tuple([zodAllLowercase]),
        output: zodAllUppercase,
        trials: [{ id: "myTrial", input: ["hello"] }],
    });

    it("requires parseAsync", () => {
        expect(() => schema.parse(async (s: string) => s.toUpperCase())).toThrow();
    });

    it("parses into an async validated function", async () => {
        const func = await schema.parseAsync(async (s: string) => s.toUpperCase());
        await expect(func("abc")).resolves.toBe("ABC");
    });

    it("reports trial issues in a ZodError", async () => {
        const error = await schema.parseAsync(async (s: string) => s.toLowerCase()).catch(e => e);
        expect(error).toBeInstanceOf(ZodError);
        expectZodErrorStructure(error, [{ message: zodAllUppercaseMessage, path: ["myTrial", "return"] }]);
    });

    it("rejects non-callable values", async () => {
        const error = await schema.parseAsync(42).catch(e => e);
        expectZodErrorStructure(error, [{ message: "Expected a callable function, but received number", path: ["(root)"] }]);
    });
});
