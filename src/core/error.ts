import { interpretError } from "src/core/interpret";
import { IssueContainer, SchemaIssue } from "src/core/types";

/**
 * The error thrown by the library-neutral utilities (and by any adapter that
 * does not have its own error class) when validation fails.
 */
export class SchemaValidationError extends Error {
    readonly issues: ReadonlyArray<SchemaIssue>;

    constructor(issues: ReadonlyArray<SchemaIssue>, message: string = interpretError({ issues })) {
        super(message);
        this.name = "SchemaValidationError";
        this.issues = issues;
    }
}

export function isSchemaValidationError(err: unknown): err is SchemaValidationError {
    return err instanceof SchemaValidationError;
}

/** Returns `true` if `value` is an object with an `issues` array whose entries all have a string `message`. */
export function hasIssues(value: unknown): value is IssueContainer {
    if (typeof value !== "object" || value === null) return false;
    const issues = (value as { issues?: unknown }).issues;

    return Array.isArray(issues) && issues.every(issue =>
        typeof issue === "object" && issue !== null && typeof (issue as { message?: unknown }).message === "string"
    );
}

/** Thrown when a synchronous utility is used with a schema that validates asynchronously. */
export class AsyncSchemaError extends Error {
    constructor(message = "Schema validation returned a Promise. Use the async variant of this utility instead.") {
        super(message);
        this.name = "AsyncSchemaError";
    }
}
