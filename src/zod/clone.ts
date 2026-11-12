import { ZodType } from "zod";

export function zodClone<T extends ZodType>(schema: T): T {
    // This `refine` pattern allows us to copy the schema so that
    // the original metadata is not overwritten
    return schema.refine(() => true);
}