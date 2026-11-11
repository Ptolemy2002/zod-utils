import { PathSegment, SchemaIssue, SchemaPath } from "./types";

/**
 * Converts a Standard Schema issue path (which may contain `{ key }` segments)
 * into a plain array of property keys.
 */
export function normalizeIssuePath(path: ReadonlyArray<PathSegment> | undefined): PropertyKey[] {
    return (path ?? []).map(segment => typeof segment === "object" ? segment.key : segment);
}

export function issuePathStartsWith(issuePath: ReadonlyArray<PathSegment> | undefined, prefix: SchemaPath): boolean {
    if (!Array.isArray(prefix)) prefix = [prefix];
    const path = normalizeIssuePath(issuePath);
    if (path.length < prefix.length) return false;
    return prefix.every((segment, i) => path[i] === segment);
}

export function prefixIssuePath<
    I extends SchemaIssue
>(issue: I, prefix: SchemaPath): I & { path: PropertyKey[] } {
    if (!Array.isArray(prefix)) prefix = [prefix];

    const newPath: PropertyKey[] = [...prefix, ...normalizeIssuePath(issue.path)]
        .filter(p => typeof p !== "string" || p.length > 0)
    ;

    if (newPath.length === 0) newPath.push("(root)");

    return { ...issue, path: newPath };
}
