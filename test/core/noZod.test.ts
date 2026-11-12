// The `/core` import path must work without Zod installed, so nothing in `src/core` or
// `src/internal` may import Zod (directly or indirectly). Every Zod entry point is mocked
// to throw here, so any such import fails this test.
const zodImportError = "src/core must not import zod";

jest.mock("zod", () => { throw new Error(zodImportError); });
jest.mock("zod/mini", () => { throw new Error(zodImportError); });
jest.mock("zod/v4", () => { throw new Error(zodImportError); });
jest.mock("zod/v4/core", () => { throw new Error(zodImportError); });

describe("src/core", () => {
    it("loads and works without importing zod", () => {
        jest.isolateModules(() => {
            const core = require("src/core") as typeof import("src/core");
            expect(core.validate(core.functionSchema())(() => {})).toBe(true);
        });
    });

    it("is detected by this test if it imports zod", () => {
        jest.isolateModules(() => {
            expect(() => require("src/zod")).toThrow(zodImportError);
        });
    });
});
