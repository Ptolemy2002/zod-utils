import z from 'zod';
import { prefixZodIssuePath } from './prefixIssuePath';
import { InterpretableZodError, InterpretableZodIssue, ZodPath, InterpretZodErrorOptions } from './types';

export function interpretZodError(err: InterpretableZodError, options: ZodPath | InterpretZodErrorOptions = ""): string {
    if (typeof options !== "object" || Array.isArray(options)) options = { prefix: options };
    const { multiline=true, includeCode=false, prefix="" } = options;

    const modifiedErr = {
        issues: err.issues.map(issue => {
            const modifiedIssue = prefixZodIssuePath(issue, prefix);
            if (includeCode && modifiedIssue.code) {
                return {
                    ...modifiedIssue,
                    message: `[${modifiedIssue.code}] ${modifiedIssue.message}`
                }
            }

            return modifiedIssue;
        })
    };

    let result = z.prettifyError(modifiedErr);

    if (!multiline) {
        result = result.replace(/\n\s*→/g, " →");
    }

    return result;
}

export function interpretZodIssue(issue: InterpretableZodIssue, options: ZodPath | InterpretZodErrorOptions = ""): string {
    return interpretZodError({ issues: [issue] }, options);
}