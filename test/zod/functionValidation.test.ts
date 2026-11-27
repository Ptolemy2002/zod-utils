import z, { ZodError } from "zod";
import {
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
    it("skips input validation (and its transforms) when input validation is disabled", () => {
        const func = zodValidatedFunction((n: unknown) => n, { input: z.tuple([z.coerce.number()]) });
        setFunctionValidation({ input: false });
        expect(func("5")).toBe("5");
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
