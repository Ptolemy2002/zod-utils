import { AsyncSchemaError } from "src/core/error";
import { StandardSchemaV1, ValidationOutcome } from "src/core/types";

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
    return typeof value === "object" && value !== null && typeof (value as { then?: unknown }).then === "function";
}

/** Validates synchronously through the Standard Schema interface. Throws `AsyncSchemaError` if the schema is async. */
export function standardValidate<S extends StandardSchemaV1>(schema: S, value: unknown): ValidationOutcome<StandardSchemaV1.InferOutput<S>> {
    const result = schema["~standard"].validate(value);

    if (isPromiseLike(result)) {
        // Avoid an unhandled rejection from the promise we are abandoning.
        Promise.resolve(result).catch(() => {});
        throw new AsyncSchemaError();
    }

    return result as ValidationOutcome<StandardSchemaV1.InferOutput<S>>;
}

/** Validates through the Standard Schema interface, supporting both sync and async schemas. */
export async function standardValidateAsync<S extends StandardSchemaV1>(schema: S, value: unknown): Promise<ValidationOutcome<StandardSchemaV1.InferOutput<S>>> {
    return await schema["~standard"].validate(value) as ValidationOutcome<StandardSchemaV1.InferOutput<S>>;
}
