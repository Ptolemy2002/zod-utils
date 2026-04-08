import z, { ZodError } from 'zod';
import { prefixZodIssuePath } from './prefixIssuePath';
import { $ZodError } from 'zod/v4/core';

export function interpretZodError(err: ZodError | $ZodError, prefix: PropertyKey | PropertyKey[] = ""): string {
    const modifiedErr = new ZodError(
        err.issues.map(issue => prefixZodIssuePath(issue, prefix))
    );

    return z.prettifyError(modifiedErr);
}