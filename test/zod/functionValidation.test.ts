import z, { ZodError } from "zod";
import {
    createSchemaUtils, SchemaValidationError, standardAdapter, StandardSchemaV1, validatedFunction,
    getFunctionValidation, resetFunctionValidation, setFunctionValidation,
    zodFunctionSchema, zodFunctionSchemaAsync, zodValidatedFunction, zodValidatedFunctionAsync
} from "src/index";
import { expectError, expectZodErrorStructure, zodAllLowercase, zodAllLowercaseMessage, zodAllUppercase, zodAllUppercaseMessage } from "../utils";

const toUpper = (s: string) => s.toUpperCase();
const toLower = (s: string) => s.toLowerCase();
const options = { input: z.tuple([zodAllLowercase]), output: zodAllUppercase };

afterEach(() => resetFunctionValidation());

describe("getFunctionValidation / setFunctionValidation / resetFunctionValidation", () => {
    it("enables both input and output validation by default", () => {
        expect(getFunctionValidation()).toEqual({ input: true, output: true });
    });

    it("updates only the given flags and returns the previous flags", () => {
        expect(setFunctionValidation({ output: false })).toEqual({ input: true, output: true });
        expect(getFunctionValidation()).toEqual({ input: true, output: false });

        expect(setFunctionValidation({ input: false })).toEqual({ input: true, output: false });
        expect(getFunctionValidation()).toEqual({ input: false, output: false });
    });

    it("can restore the previous flags with the returned value", () => {
        const previous = setFunctionValidation({ input: false, output: false });
        setFunctionValidation(previous);
        expect(getFunctionValidation()).toEqual({ input: true, output: true });
    });

    it("resets the flags to their defaults", () => {
        setFunctionValidation({ input: false, output: false });
        resetFunctionValidation();
        expect(getFunctionValidation()).toEqual({ input: true, output: true });
    });
});

describe("validated functions with the global flags", () => {
    it("skips input and output schemas that do not transform when validation is disabled", () => {
        let checks = 0;
        const counted = z.string().refine(() => { checks++; return true; });
        const func = zodValidatedFunction((s: string) => s, { input: z.tuple([counted]), output: counted });

        func("a");
        expect(checks).toBe(2);

        setFunctionValidation({ input: false, output: false });
        func("a");
        expect(checks).toBe(2);
    });

    it("still runs input and output schemas that may transform when validation is disabled", async () => {
        const options = { input: z.tuple([z.coerce.number()]), output: z.number().transform(n => n * 2) };
        const func = zodValidatedFunction((n: number) => n + 1, options);
        const asyncFunc = zodValidatedFunctionAsync((n: number) => n + 1, options);
        setFunctionValidation({ input: false, output: false });

        expect(func("5")).toBe(12);
        await expect(asyncFunc("5")).resolves.toBe(12);
        // Since the schema runs, it also validates.
        expect(() => func("not a number")).toThrow(ZodError);
    });

    it("still runs schemas that are not known to be free of transforms when validation is disabled", () => {
        // Not a Zod schema, so it cannot be inspected.
        const opaque: StandardSchemaV1<unknown[], unknown[]> = {
            "~standard": { version: 1, vendor: "other", validate: (value) => ({ value: (value as unknown[]).map(Number) }) },
        };

        setFunctionValidation({ input: false });
        expect(validatedFunction((n: unknown) => n, { input: opaque })("5")).toBe(5);
    });

    it("never skips schemas for adapters without mayTransform", () => {
        const { mayTransform: _, ...adapter } = standardAdapter;
        const utils = createSchemaUtils(adapter);
        setFunctionValidation({ input: false });
        expect(() => utils.validatedFunction((s: string) => s, { input: z.tuple([zodAllLowercase]) })("HELLO")).toThrow(SchemaValidationError);
    });

    it("detects Zod schemas passed to the library-neutral functions", () => {
        setFunctionValidation({ input: false });
        expect(validatedFunction((s: string) => s, { input: z.tuple([zodAllLowercase]) })("HELLO")).toBe("HELLO");
    });

    it("still validates the output when only input validation is disabled", () => {
        const func = zodValidatedFunction(toLower, options);
        setFunctionValidation({ input: false });

        expectError(() => func("HELLO"), ZodError, (e) => {
            expectZodErrorStructure(e, [{ message: zodAllUppercaseMessage, path: ["return"] }]);
        });
    });

    it("skips output validation when output validation is disabled, but still validates the input", () => {
        const func = zodValidatedFunction(toLower, options);
        setFunctionValidation({ output: false });
        expect(func("hello")).toBe("hello");

        expectError(() => func("HELLO"), ZodError, (e) => {
            expectZodErrorStructure(e, [{ message: zodAllLowercaseMessage, path: ["args", 0] }]);
        });
    });

    it("applies flag changes to wrappers created before the change", () => {
        const func = zodValidatedFunction(toLower, options);
        expect(() => func("hello")).toThrow(ZodError);

        setFunctionValidation({ output: false });
        expect(func("hello")).toBe("hello");

        resetFunctionValidation();
        expect(() => func("hello")).toThrow(ZodError);
    });

    it("applies the flags to async validated functions", async () => {
        const func = zodValidatedFunctionAsync(toLower, options);
        setFunctionValidation({ input: false, output: false });
        await expect(func("HELLO")).resolves.toBe("hello");
    });

    it("applies the flags to functions parsed by function schemas", async () => {
        setFunctionValidation({ input: false, output: false });
        expect(zodFunctionSchema(options).parse(toLower)("HELLO")).toBe("hello");
        await expect((await zodFunctionSchemaAsync(options).parseAsync(toLower))("HELLO")).resolves.toBe("hello");
    });

    it("always validates the input and output in trials", async () => {
        setFunctionValidation({ input: false, output: false });

        const schema = zodFunctionSchema({ ...options, trials: [{ id: "a", input: ["HELLO"] }, { id: "b", input: ["hello"] }] });
        const expected = [
            { message: zodAllUppercaseMessage, path: ["b", "return"] },
            { message: zodAllLowercaseMessage, path: ["a", "args", 0] },
        ];

        expectError(() => schema.parse(toLower), ZodError, (e) => expectZodErrorStructure(e, expected));

        const asyncSchema = zodFunctionSchemaAsync({ ...options, trials: [{ id: "a", input: ["HELLO"] }, { id: "b", input: ["hello"] }] });
        const result = await asyncSchema.safeParseAsync(toLower);
        expect(result.success).toBe(false);
        expectZodErrorStructure(result.error!, expected);

        // The parsed function itself still follows the flags.
        const passing = zodFunctionSchema({ ...options, trials: [{ input: ["hello"] }] }).parse(toUpper);
        expect(passing("HELLO")).toBe("HELLO");
    });
});
