import z, { ZodError } from 'zod';
import { prefixZodIssuePath } from './prefixIssuePath';

export function interpretZodError(err: ZodError, prefix: PropertyKey | PropertyKey[] = ""): string {
    const modifiedErr = new ZodError(
        err.issues.map(issue => prefixZodIssuePath(issue, prefix))
    );

    return z.prettifyError(modifiedErr);
}