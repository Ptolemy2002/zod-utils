import { issuePathStartsWith } from "src/issuePathStartsWith";

describe("issuePathStartsWith", () => {
    it("returns true when a single-segment string prefix matches", () => {
        expect(issuePathStartsWith(["args", 0], "args")).toBe(true);
    });

    it("returns true when a single-segment array prefix matches", () => {
        expect(issuePathStartsWith(["args", 0], ["args"])).toBe(true);
    });

    it("returns true when a multi-segment array prefix matches", () => {
        expect(issuePathStartsWith(["args", 0, "field"], ["args", 0])).toBe(true);
    });

    it("returns true when the path exactly equals the prefix", () => {
        expect(issuePathStartsWith(["return"], "return")).toBe(true);
    });

    it("returns false when the first segment does not match", () => {
        expect(issuePathStartsWith(["return", "field"], "args")).toBe(false);
    });

    it("returns false when the path is shorter than the prefix", () => {
        expect(issuePathStartsWith(["args"], ["args", 0])).toBe(false);
    });

    it("returns false for an empty path against a non-empty prefix", () => {
        expect(issuePathStartsWith([], "args")).toBe(false);
    });

    it("returns true for an empty prefix against any path", () => {
        expect(issuePathStartsWith(["args", 0], [])).toBe(true);
    });

    it("correctly compares numeric path segments", () => {
        expect(issuePathStartsWith([0, "field"], [0])).toBe(true);
        expect(issuePathStartsWith([1, "field"], [0])).toBe(false);
    });
});
