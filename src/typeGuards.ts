import { ZodError } from 'zod';

export function isZodError(err: unknown): err is ZodError {
    return !!err && (
        err instanceof ZodError || (err instanceof Error && err.name === 'ZodError')
    );
}