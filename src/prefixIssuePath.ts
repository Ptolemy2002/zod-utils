import z from "zod";

export function prefixZodIssuePath(issue: z.core.$ZodIssue, prefix: PropertyKey | PropertyKey[]): z.core.$ZodIssue {
    if (!Array.isArray(prefix)) prefix = [prefix];

    const newPath: PropertyKey[] = [...prefix, ...issue.path]
        .filter(p => typeof p !== "string" || p.length > 0)
    ;
    
    if (newPath.length === 0) newPath.push("(root)");

    return { ...issue, path: newPath };
}