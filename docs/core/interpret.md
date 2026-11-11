# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type PathSegment = PropertyKey | Readonly<{ key: PropertyKey }>;

type SchemaPath = PropertyKey | PropertyKey[];

type SchemaIssue = Readonly<{
    code?: string;
    message: string;
    path?: ReadonlyArray<PathSegment>;
}>;

type IssueContainer = Readonly<{
    issues: ReadonlyArray<SchemaIssue>;
}>;

type InterpretErrorOptions = {
    prefix?: SchemaPath;
    multiline?: boolean;
    includeCode?: boolean;
};

// Zod aliases
type ZodPath = SchemaPath;
type InterpretableZodIssue = SchemaIssue;
type InterpretableZodError = IssueContainer;
type InterpretZodErrorOptions = InterpretErrorOptions;
```

# interpretError
```typescript
function interpretError(err: IssueContainer, options?: SchemaPath | InterpretErrorOptions): string
```
Converts an error-like object with `issues` into a human-readable string, optionally prepending a path prefix to every issue. If the resulting path for an issue is empty (because the prefix was empty or consisted entirely of empty strings), the path is replaced with `"(root)"`. The output format is the same as Zod's `z.prettifyError`, but Zod is not required.

`interpretZodError` is the same function, kept under its original name.

## Parameters
- `err` (`IssueContainer`): The error object to interpret. Any object with an `issues` array of `{ code?, message, path? }` entries is accepted, including `ZodError`, `SchemaValidationError`, and Standard Schema failure results from any library. Path segments may be property keys or `{ key }` objects.
- `options` (`SchemaPath | InterpretErrorOptions`, optional): Either a shorthand prefix value or an options object. Defaults to `""`.
  - When passed as a `PropertyKey` or `PropertyKey[]`, treated as `{ prefix: options }`.
  - `prefix` (`SchemaPath`, optional): A key or array of keys prepended to each issue's path. Non-array values are converted to a single-element array. Empty strings are filtered out. Defaults to `""`.
  - `multiline` (`boolean`, optional): When `true` (default), each issue's path appears on its own line below the message. When `false`, the path arrow is placed on the same line as the message.
  - `includeCode` (`boolean`, optional): When `true`, each issue's `code` (if present) is prepended to the message in brackets, e.g. `[custom] message`. Issues without a `code` are unaffected. Defaults to `false`.

## Returns
- `string`: A human-readable representation of the error, with one `✖ message` line per issue (sorted by path length), each followed by its path.

# interpretIssue
```typescript
function interpretIssue(issue: SchemaIssue, options?: SchemaPath | InterpretErrorOptions): string
```
Convenience wrapper around `interpretError` for formatting a single issue. Wraps the issue in a one-element `issues` array and delegates to `interpretError`.

`interpretZodIssue` is the same function, kept under its original name.

## Parameters
- `issue` (`SchemaIssue`): The single issue to interpret.
- `options` (`SchemaPath | InterpretErrorOptions`, optional): Forwarded directly to `interpretError`. Defaults to `""`.

## Returns
- `string`: A human-readable representation of the single issue.
