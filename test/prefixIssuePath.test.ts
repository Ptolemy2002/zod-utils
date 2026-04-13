import { prefixZodIssuePath } from "src/prefixIssuePath";
import { zodAlwaysReject, zodAlwaysRejectNested } from "./utils";
import { $ZodIssue } from "zod/v4/core";

describe("prefixZodIssuePath", () => {
    it("correctly prefixes the issue path with a string", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, "prefix");
        expect(prefixedIssue.path).toEqual(["prefix"]);
    });

    it("correctly prefixes the issue path with an array", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, ["pre", "fix"]);
        expect(prefixedIssue.path).toEqual(["pre", "fix"]);
    });

    it("adds the root path if the prefix is empty", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, []);
        expect(prefixedIssue.path).toEqual(["(root)"]);
    });

    it("adds the root path if the prefix is full of empty strings", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, ["", "", ""]);
        expect(prefixedIssue.path).toEqual(["(root)"]);
    });

    it("adds the root path if the prefix is an empty string", () => {
        const issue = zodAlwaysReject.safeParse("some value").error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, "");
        expect(prefixedIssue.path).toEqual(["(root)"]);
    });

    it("prepends the prefix to an existing nested issue path", () => {
        const issue = zodAlwaysRejectNested.safeParse({ nested: "some value" }).error!.issues[0]!;
        const prefixedIssue = prefixZodIssuePath(issue, "prefix");
        expect(prefixedIssue.path).toEqual(["prefix", "nested"]);
    });

    it("accepts an object without an issue path", () => {
        const issue = { code: "custom", message: "An error occurred" } as $ZodIssue;
        const prefixedIssue = prefixZodIssuePath(issue, "prefix");
        expect(prefixedIssue.path).toEqual(["prefix"]);
    });
});