import { ZodError } from 'zod';
import { $ZodError } from 'zod/v4/core';

export function isZodError(err: unknown): err is ZodError | $ZodError {
    return !!err && (
        err instanceof ZodError || err instanceof $ZodError || (
            err instanceof Error && (
                err.name === 'ZodError' || err.name === '$ZodError'
            )
        )
    );
}