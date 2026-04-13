import { InterpretableZodIssue } from "./types";

export function prefixZodIssuePath<
    I extends InterpretableZodIssue
>(issue: I, prefix: PropertyKey | PropertyKey[]): I {
    if (!Array.isArray(prefix)) prefix = [prefix];

    const newPath: PropertyKey[] = [...prefix, ...(issue.path ?? [])]
        .filter(p => typeof p !== "string" || p.length > 0)
    ;
    
    if (newPath.length === 0) newPath.push("(root)");

    return { ...issue, path: newPath };
}