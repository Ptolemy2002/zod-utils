import z, { ZodError } from "zod";
import { zodFunctionSchema, zodValidatedFunction } from "src/function";
import { expectError, zodAllLowercase, zodAllLowercaseMessage, zodAllUppercase, expectZodErrorStructure, zodAllUppercaseMessage, zodErrorStructureString } from "./utils";

const correctFunc = (s: string) => s.toUpperCase();
const wrongFunc = (s: string) => s.toLowerCase();

const errToThrow = new Error("Test error");

const throwingFunc = (s: string) => {
    throw errToThrow;
};

const zodThrowingFunc = (s: string) => {
    throw new ZodError([{
        code: "custom",
        message: "Inner ZodError",
        path: ["test"]
    }]);
};

const customPaths = { inputPath: "parameters", outputPath: "result" };

const correctSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });
const correctSchemaCustomPath = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase, ...customPaths });

const wrongSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });
const wrongSchemaCustomPath = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase, ...customPaths });

const throwingSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });
const zodThrowingSchema = zodFunctionSchema({ input: z.tuple([zodAllLowercase]), output: zodAllUppercase });

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

    it("Does not modify the path of ZodErrors thrown by the function during execution instead of after returning", () => {
        expectError(() => {
            zodThrowingSchema.parse(zodThrowingFunc)("hello")
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: "Inner ZodError",
                    path: ["test"]
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

    describe("trials", () => {
        it("does not call the function if there are no trials", () => {
            let called = false;
            const schema = zodFunctionSchema();
            schema.parse(() => { called = true; });
            expect(called).toBe(false);
        });

        it("passes when all trials succeed", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [{ input: ["hello"] }]
            });
            expect(() => schema.parse(correctFunc)).not.toThrow();
        });

        it("uses 'trial_N' as the default trial id in error paths", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [{ input: ["hello"] }]
            });
            
            expectError(() => {
                schema.parse(wrongFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllUppercaseMessage,
                        path: ["trial_0", "return"]
                    }
                ]);
            });
        });

        it("uses the specified trial id in error paths", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [{ id: "myTrial", input: ["hello"] }]
            });
            expectError(() => {
                schema.parse(wrongFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllUppercaseMessage,
                        path: ["myTrial", "return"]
                    }
                ]);
            });
        });

        it("reports input validation errors from args with the trial id in the path", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [{ id: "myTrial", input: ["HELLO"] }]
            });
            expectError(() => {
                schema.parse(correctFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllLowercaseMessage,
                        path: ["myTrial", "args", 0]
                    }
                ]);
            });
        });

        it("reports output validation errors from return with the trial id in the path", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [{ id: "myTrial", input: ["hello"] }]
            });

            expectError(() => {
                schema.parse(wrongFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllUppercaseMessage,
                        path: ["myTrial", "return"]
                    }
                ]);
            });
        });


        it("validates trial output against a custom outputSchema", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                trials: [{ id: "myTrial", input: ["hello"], outputSchema: zodAllLowercase }]
            });

            expectError(() => {
                schema.parse(correctFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllLowercaseMessage,
                        path: ["myTrial"]
                    }
                ]);
            });

            expect(() => schema.parse(wrongFunc)).not.toThrow();
        });

        it("adds an 'Unexpected Success' error when error is 'require' and no error is thrown", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                trials: [{ id: "myTrial", input: ["hello"], error: "require" }]
            });
            expectError(() => {
                schema.parse(correctFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: "Unexpected Success",
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("does not add an error when error is 'require' and an error is thrown", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [], error: "require" }]
            });
            expect(() => schema.parse(throwingFunc)).not.toThrow();
        });

        it("adds an 'Unexpected Error' issue when any error is thrown by default", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [] }]
            });
            expectError(() => {
                schema.parse(throwingFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: `Unexpected Error: ${errToThrow.message}`,
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("adds an 'Unexpected Error' issue when any error is thrown when error is 'forbid'", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [], error: "forbid" }]
            });

            expectError(() => {
                schema.parse(throwingFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: `Unexpected Error: ${errToThrow.message}`,
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("does not add an error when error is 'allow' and any error is thrown", () => {
            const throwingNonError = () => { throw "not an error"; };
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [], error: "allow" }]
            });
            expect(() => schema.parse(throwingNonError)).not.toThrow();
        });

        it("uses a custom error function to selectively allow thrown errors", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [], error: (e) => e instanceof ZodError }]
            });

            expectError(() => {
                schema.parse(throwingFunc);  // throws Error, not ZodError
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: `Unexpected Error: ${errToThrow.message}`,
                        path: ["myTrial"]
                    }
                ]);
            });

            expect(() => schema.parse(zodThrowingFunc)).not.toThrow();  // throws ZodError, which is allowed
        });

        it("uses a custom error object with a require function to selectively require thrown errors", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [], error: { require: (e) => e instanceof TypeError } }]
            });

            expectError(() => {
                schema.parse(throwingFunc);  // throws Error, not TypeError
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: `Unexpected Error: ${errToThrow.message}`,
                        path: ["myTrial"]

                    }
                ]);
            });
        });

        it("uses a custom errorStringify to format the error message", () => {
            const schema = zodFunctionSchema({
                trials: [{
                    id: "myTrial",
                    input: [],
                    errorStringify: () => "custom error message"
                }]
            });

            expectError(() => {
                schema.parse(throwingFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: "Unexpected Error: custom error message",
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("stringifies non-Error thrown values using toString by default", () => {
            const throwingNonError = () => { throw { custom: "value", toString() { return "non-error object"; } }; };
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [] }]
            });

            expectError(() => {
                schema.parse(throwingNonError);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: "Unexpected Error: non-error object",
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("stringifies ZodErrors using interpretZodError by default", () => {
            const schema = zodFunctionSchema({
                trials: [{ id: "myTrial", input: [] }]
            });

            expectError(() => {
                schema.parse(zodThrowingFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: `Unexpected Error: ${
                            zodErrorStructureString([{
                                message: "Inner ZodError",
                                path: ["test"],
                                multiline: false
                            }])
                        }`,
                        path: ["myTrial"]
                    }
                ]);
            });
        });

        it("reports errors from multiple trials", () => {
            const schema = zodFunctionSchema({
                input: z.tuple([zodAllLowercase]),
                output: zodAllUppercase,
                trials: [
                    { id: "trial_a", input: ["hello"] },
                    { id: "trial_b", input: ["world"] }
                ]
            });
            expectError(() => {
                schema.parse(wrongFunc);
            }, ZodError, (e) => {
                expectZodErrorStructure(e, [
                    {
                        message: zodAllUppercaseMessage,
                        path: ["trial_a", "return"]
                    },
                    {
                        message: zodAllUppercaseMessage,
                        path: ["trial_b", "return"]
                    }
                ]);
            });
        });
    });
});

describe("zodValidatedFunction", () => {
    it("accepts any arbitrary function by default", () => {
        const validatedFunc = zodValidatedFunction((s: string) => s.toUpperCase() + s.toLowerCase());
        expect(validatedFunc("hello")).toBe("HELLOhello");
    });

    it("registers an argument validation error after an already successful call (by resetting internal reachedCaller state)", () => {
        const validatedFunc = zodValidatedFunction((s: string) => s.toUpperCase(), {
            input: z.tuple([zodAllLowercase]),
            output: zodAllUppercase
        });

        // First call to set reachedCaller to true
        validatedFunc("hello");

        // Second call with invalid input should not be affected by the first call's reachedCaller state
        // If it is, the path will be "return" instead of "args"
        expectError(() => {
            validatedFunc("HELLO");
        }, ZodError, (e) => {
            expectZodErrorStructure(e, [
                {
                    message: zodAllLowercaseMessage,
                    path: ["args", 0]
                }
            ]);
        });
    });
});