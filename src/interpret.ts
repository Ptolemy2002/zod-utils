import z from 'zod';
import { prefixZodIssuePath } from './prefixIssuePath';
import { InterpretableZodError, InterpretableZodIssue } from './types';

export type InterpretZodErrorOptions = {
    prefix?: PropertyKey | PropertyKey[];
    multiline?: boolean;
};

export function interpretZodError(err: InterpretableZodError, options: PropertyKey | PropertyKey[] | InterpretZodErrorOptions = ""): string {
    if (typeof options !== "object" || Array.isArray(options)) options = { prefix: options };
    const { multiline=true, prefix="" } = options;

    const modifiedErr = {
        issues: err.issues.map(issue => prefixZodIssuePath(issue, prefix))
    };

    let result = z.prettifyError(modifiedErr);

    if (!multiline) {
        result = result.replace(/\n\s*→/g, " →");
    }

    return result;
}

export function interpretZodIssue(issue: InterpretableZodIssue, options: PropertyKey | PropertyKey[] | InterpretZodErrorOptions = ""): string {
    return interpretZodError({ issues: [issue] }, options);
}