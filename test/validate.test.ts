import { ZodError } from "zod";
import { expectZodValidation, expectZodValidationWithErrors, zodAlwaysAccept, zodAlwaysReject, zodAlwaysRejectNested, zodAlwaysRejectMessage, expectError, expectZodErrorStructure } from "./utils";
import { zodValidateWithErrors } from "src/index";

describe("zodValidate", () => {
    it("returns false when the schema rejects", () => {
        expectZodValidation(zodAlwaysReject, { failed: true });
    });

    it("returns true when the schema accepts", () => {
        expectZodValidation(zodAlwaysAccept, { failed: false });
    });
});

describe("zodValidateWithErrors", () => {
    it("rejects when the schema rejects", () => {
        expectZodValidationWithErrors(zodAlwaysReject, { failed: true });
    });

    it("accepts when the schema accepts", () => {
        expectZodValidationWithErrors(zodAlwaysAccept, { failed: false });
    });

    it("provides the correct error message when the schema rejects at the root", () => {
        expectZodValidationWithErrors(zodAlwaysReject, {
            failed: true,
            expectedMessage: [
                { message: zodAlwaysRejectMessage, path: ["(root)"] },
            ],
        });
    });

    it("provides the correct error message when the schema rejects at a nested path", () => {
        expectZodValidationWithErrors(zodAlwaysRejectNested, {
            failed: true,
            value: { nested: "some value" },
            expectedMessage: [
                { message: zodAlwaysRejectMessage, path: ["nested"] },
            ],
        });
    });

    it("throws the error when _throw is true", () => {
        expectError(() => zodValidateWithErrors(zodAlwaysReject, { _throw: true })("some value"), ZodError, (e) => {
            expectZodErrorStructure(e, [
                { message: zodAlwaysRejectMessage, path: ["(root)"] },
            ]);
        });
    });
});