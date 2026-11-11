import { prefixIssuePath } from "./path";
import { IssueContainer, SchemaIssue, SchemaPath, InterpretErrorOptions } from "./types";

// Mirrors Zod's `toDotPath` so that output is identical to `z.prettifyError`
// without requiring Zod.
function toDotPath(path: PropertyKey[]): string {
    const segs: string[] = [];

    for (const seg of path) {
        if (typeof seg === "number") segs.push(`[${seg}]`);
        else if (typeof seg === "symbol") segs.push(`[${JSON.stringify(String(seg))}]`);
        else if (/[^\w$]/.test(seg)) segs.push(`[${JSON.stringify(seg)}]`);
        else {
            if (segs.length) segs.push(".");
            segs.push(seg);
        }
    }

    return segs.join("");
}

// Mirrors Zod's `prettifyError` (issues sorted by path length, each followed by its path).
function prettifyIssues(issues: ReadonlyArray<{ message: string; path: PropertyKey[] }>): string {
    const lines: string[] = [];
    const sorted = [...issues].sort((a, b) => a.path.length - b.path.length);

    for (const { message, path } of sorted) {
        lines.push(`✖ ${message}`);
        if (path.length) lines.push(`  → at ${toDotPath(path)}`);
    }

    return lines.join("\n");
}

export function interpretError(err: IssueContainer, options: SchemaPath | InterpretErrorOptions = ""): string {
    if (typeof options !== "object" || Array.isArray(options)) options = { prefix: options };
    const { multiline=true, includeCode=false, prefix="" } = options;

    const issues = err.issues.map(issue => {
        const modifiedIssue = prefixIssuePath(issue, prefix);
        if (includeCode && modifiedIssue.code) {
            return {
                ...modifiedIssue,
                message: `[${modifiedIssue.code}] ${modifiedIssue.message}`
            };
        }

        return modifiedIssue;
    });

    let result = prettifyIssues(issues);

    if (!multiline) {
        result = result.replace(/\n\s*→/g, " →");
    }

    return result;
}

export function interpretIssue(issue: SchemaIssue, options: SchemaPath | InterpretErrorOptions = ""): string {
    return interpretError({ issues: [issue] }, options);
}
