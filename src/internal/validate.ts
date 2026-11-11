import type { SchemaAdapter } from "../core/adapter";
import { interpretError } from "../core/interpret";
import * as t from "../core/types";
import { standardValidate, standardValidateAsync } from "./standardValidate";

type Out<S extends t.StandardSchemaV1> = t.StandardSchemaV1.InferOutput<S>;

function toValidationResult<O>(
    adapter: SchemaAdapter<any, any, any>,
    outcome: t.ValidationOutcome<O>,
    { _throw = false, ...options }: t.ValidateWithErrorsOptions,
): t.ValidationResult<O> {
    if (!outcome.issues) return { success: true, value: outcome.value };
    if (_throw) throw adapter.createError(outcome.issues);
    return { success: false, error: interpretError(outcome, options) };
}

export function validate<S extends t.StandardSchemaV1>(schema: S): t.Validator<Out<S>> {
    return (v): v is Out<S> => !standardValidate(schema, v).issues;
}

export function validateAsync<S extends t.StandardSchemaV1>(schema: S): t.AsyncValidator {
    return async (v) => !(await standardValidateAsync(schema, v)).issues;
}

export function validateWithErrors<S extends t.StandardSchemaV1>(
    adapter: SchemaAdapter<any, any, any>,
    schema: S,
    options: t.ValidateWithErrorsOptions = {},
): t.ValidatorWithErrors<Out<S>> {
    return (v) => toValidationResult(adapter, standardValidate(schema, v), options);
}

export function validateWithErrorsAsync<S extends t.StandardSchemaV1>(
    adapter: SchemaAdapter<any, any, any>,
    schema: S,
    options: t.ValidateWithErrorsOptions = {},
): t.AsyncValidatorWithErrors<Out<S>> {
    return async (v) => toValidationResult(adapter, await standardValidateAsync(schema, v), options);
}
