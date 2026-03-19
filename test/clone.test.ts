import { zodClone } from "src/clone";
import { expectZodValidation, zodAlwaysAccept, zodAlwaysReject } from "./utils";

describe("zodClone", () => {
    it("creates a new instance", () => {
        const clonedAccept = zodClone(zodAlwaysAccept);
        expect(clonedAccept).not.toBe(zodAlwaysAccept);

        const clonedReject = zodClone(zodAlwaysReject);
        expect(clonedReject).not.toBe(zodAlwaysReject);
    });

    it("preserves the original schema's behavior", () => {
        const clonedAccept = zodClone(zodAlwaysAccept);
        expectZodValidation(clonedAccept, { failed: false });

        const clonedReject = zodClone(zodAlwaysReject);
        expectZodValidation(clonedReject, { failed: true });
    });
});