# Type Reference
The following is a reference to types relevant to the classes and functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type SchemaIssue = Readonly<{
    code?: string;
    message: string;
    path?: ReadonlyArray<PathSegment>;
}>;

type IssueContainer = Readonly<{
    issues: ReadonlyArray<SchemaIssue>;
}>;
```

# SchemaValidationError
The error thrown by the library-neutral utilities (those built from [`standardAdapter`](./adapter.md#standardadapter)) when validation fails. It can also be used as the error type for an adapter whose library has no error class of its own.

## Constructor
```typescript
constructor(issues: ReadonlyArray<SchemaIssue>, message: string = interpretError({ issues }))
```
- `issues` (`ReadonlyArray<SchemaIssue>`): The issues that caused the failure.
- `message` (`string`, optional): The error message. Defaults to the issues formatted with [`interpretError`](./interpret.md).

## Properties
- `name` (`string`): Always `"SchemaValidationError"`.
- `issues` (`ReadonlyArray<SchemaIssue>`): The issues passed to the constructor.

# AsyncSchemaError
Thrown by the synchronous utilities when a schema's validation returns a `Promise`. Use the async variant of the utility instead.

## Constructor
```typescript
constructor(message?: string)
```
- `message` (`string`, optional): The error message. Defaults to a message recommending the async variant.

## Properties
- `name` (`string`): Always `"AsyncSchemaError"`.

# isSchemaValidationError
```typescript
function isSchemaValidationError(err: unknown): err is SchemaValidationError
```
Returns `true` if `err` is a `SchemaValidationError` instance.

## Parameters
- `err` (`unknown`): The value to test.

## Returns
- `boolean`: `true` if `err` is a `SchemaValidationError`, `false` otherwise.

# hasIssues
```typescript
function hasIssues(value: unknown): value is IssueContainer
```
Returns `true` if `value` is an object with an `issues` array whose entries are all objects with a string `message`. This matches `ZodError`, `SchemaValidationError`, Standard Schema failure results, and the errors of most other schema libraries.

## Parameters
- `value` (`unknown`): The value to test.

## Returns
- `boolean`: `true` if `value` carries a list of issues, `false` otherwise.
