import { ZodPath } from "./types";

export function issuePathStartsWith(issuePath: PropertyKey[], prefix: ZodPath): boolean {
    if (!Array.isArray(prefix)) prefix = [prefix];
    if (issuePath.length < prefix.length) return false;
    return prefix.every((segment, i) => issuePath[i] === segment);
}
