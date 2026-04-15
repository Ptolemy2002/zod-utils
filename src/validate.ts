import { interpretZodError } from './interpret';
import * as t from './types';

export function zodValidate<O>(
    p: t.ZodSafeParseable<O>,
): t.ZodValidator<O> {
    return (v): v is O => {
        const result = p.safeParse(v);
        return result.success;
    };
}

export function zodValidateWithErrors<O>(
    p: t.ZodSafeParseable<O>,
    {
        _throw = false,
        ...options
    }: t.ZodValidateWithErrorsOptions = {},
): t.ZodValidatorWithErrors<O> {
    return (_v) => {
        const { success, error, data: v } = p.safeParse(_v);
        if (success) return { success, value: v };
        if (_throw) throw error;

        return { success, error: interpretZodError(error, options) };
    };
}