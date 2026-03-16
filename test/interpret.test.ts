import { interpretZodError } from "src/interpret";
import { expectZodErrorStructure, zodAlwaysReject, zodAlwaysRejectMessage } from "./utils";

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
});