import z, { ZodError } from 'zod';

export function interpretZodError(err: ZodError, prefix: PropertyKey | PropertyKey[] = ""): string {
    if (!Array.isArray(prefix)) prefix = [prefix];

    const modifiedErr = new ZodError(
        err.issues.map(issue => {
            const newPath: PropertyKey[] = [...prefix, ...issue.path]
                .filter(p => typeof p !== "string" || p.length > 0)
            ;
            
            if (newPath.length === 0) newPath.push("(root)");

            return { ...issue, path: newPath }
        })
    );

    return z.prettifyError(modifiedErr);
}