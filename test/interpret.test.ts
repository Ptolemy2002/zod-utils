import { interpretZodError, interpretZodIssue } from "src/interpret";
import { expectZodErrorStructure, expectZodIssueStructure, zodAlwaysReject, zodAlwaysRejectMessage, zodAlwaysRejectMultiple, zodAlwaysRejectMultipleMessage1, zodAlwaysRejectMultipleMessage2 } from "./utils";

describe("interpretZodError", () => {
    it("correctly interprets an error at the root level", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err);

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["(root)"] },
        ]);
    });

    it("does not add the root path if there is a prefix that is not empty", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, ["pre", "fix"]);

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["pre", "fix"] },
        ]);
    });

    it("adds the root path if the prefix is empty", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, []);

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["(root)"] },
        ]);
    });

    it("adds the root path if the prefix is full of empty strings", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, ["", "", ""]);

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["(root)"] },
        ]);
    });

    it("correctly converts a prefix that is not an array to an array", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, "prefix");

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["prefix"] },
        ]);
    });

    it("adds the root path if the prefix is an empty string", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, "");

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMessage, path: ["(root)"] },
        ]);
    });

    it("reports message and path on the same line if multiline is set to false", () => {
        const err = zodAlwaysRejectMultiple.safeParse("some value").error!;
        const result = interpretZodError(err, { multiline: false });

        expectZodErrorStructure(result, [
            { message: zodAlwaysRejectMultipleMessage1, path: ["(root)"], multiline: false },
            { message: zodAlwaysRejectMultipleMessage2, path: ["(root)"], multiline: false },
        ]);
    });

    it("includes the code in the message if includeCode is set to true", () => {
        const err = zodAlwaysReject.safeParse("some value").error!;
        const result = interpretZodError(err, { includeCode: true });

        expectZodErrorStructure(result, [
            { code: "custom", message: `${zodAlwaysRejectMessage}`, path: ["(root)"] },
        ]);
    });
});

describe("interpretZodIssue", () => {
    it("delegates to interpretZodError with the issue wrapped in an error object", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const result = interpretZodIssue(issue);

        expectZodIssueStructure(result, {
            message: zodAlwaysRejectMessage,
            path: ["(root)"]
        });
    });
});