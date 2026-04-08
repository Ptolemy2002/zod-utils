import z, { ZodError } from "zod";
import { zodFunctionSchema } from "src/function";
import { expectError, zodAllLowercase, zodAllLowercaseMessage, zodAllUppercase, expectZodErrorStructure, zodAllUppercaseMessage } from "./utils";

const correctFunc = (s: string) => s.toUpperCase();
const wrongFunc = (s: string) => s.toLowerCase();

const errToThrow = new Error("Test error");
const throwingFunc = (s: string) => {
    throw errToThrow;
};

const customPaths = { inputPath: "parameters", outputPath: "result" };

const correctSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });
const correctSchemaCustomPath = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase, ...customPaths });

const wrongSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });
const wrongSchemaCustomPath = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase, ...customPaths });

const throwingSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });

describe("zodFunctionSchema", () => {
    it("rejects a non-function input", () => {
        expectError(() => {
            zodFunctionSchema().parse(42);
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: "Expected a callable function, but received number",
                    path: ["(root)"]
                }
            ]);
        });
    });

    it("accepts a function where both the input and output pass validation", () => {
        expect(() => {
            correctSchema.parse(correctFunc)("hello")
        }).not.toThrow();
    });

    it("rejects with the correct path when the input fails validation", () => {
        expectError(() => {
            correctSchemaCustomPath.parse(correctFunc)("HELLO")
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: zodAllLowercaseMessage,
                    path: [customPaths.inputPath, 0]
                }
            ]);
        });
    });

    it("defaults to an inputPath of 'args'", () => {
        expectError(() => {
            correctSchema.parse(correctFunc)("HELLO")
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: zodAllLowercaseMessage,
                    path: ["args", 0]
                }
            ]);
        });
    });

    it("rejects with the correct path when the output fails validation", () => {
        expectError(() => {
            wrongSchemaCustomPath.parse(wrongFunc)("hello")
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: zodAllUppercaseMessage,
                    path: [customPaths.outputPath]
                }
            ]);
        });
    });

    it("defaults to an outputPath of 'return'", () => {
        expectError(() => {
            wrongSchema.parse(wrongFunc)("hello")
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: zodAllUppercaseMessage,
                    path: ["return"]
                }
            ]);
        });
    });

    it("rethrows non-Zod errors", () => {
        expect(() => {
            throwingSchema.parse(throwingFunc)("hello")
        }).toThrow(errToThrow);
    });

    it("passes if no output validation is specified", () => {
        const schema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]) });
        expect(() => {
            schema.parse(correctFunc)("hello")
        }).not.toThrow();
    });

    it("passes if no input validation is specified", () => {
        const schema = zodFunctionSchema({ output: zodAllUppercase });
        expect(() => {
            schema.parse(correctFunc)("hello")
        }).not.toThrow();
    });
});