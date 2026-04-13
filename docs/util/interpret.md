# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type ZodPath = PropertyKey | PropertyKey[];

type InterpretableZodIssue = Readonly<{
    code?: string;
    message: string;
    path?: PropertyKey[];
}>;

type InterpretableZodError = Readonly<{
    issues: InterpretableZodIssue[];
}>;

type InterpretZodErrorOptions = {
    prefix?: ZodPath;
    multiline?: boolean;
    includeCode?: boolean;
};
```

# interpretZodError
```typescript
function interpretZodError(err: InterpretableZodError, options?: ZodPath | InterpretZodErrorOptions): string
```
Converts an error-like object with `issues` into a human-readable string, optionally prepending a path prefix to every issue. If the resulting path for an issue is empty (because the prefix was empty or consisted entirely of empty strings), the path is replaced with `"(root)"`.

## Parameters
- `err` (`InterpretableZodError`): The error object to interpret. Any object with an `issues` array of `{ code?, message, path? }` entries is accepted, including `ZodError` and `$ZodError` instances.
- `options` (`ZodPath | InterpretZodErrorOptions`, optional): Either a shorthand prefix value or an options object. Defaults to `""`.
  - When passed as a `PropertyKey` or `PropertyKey[]`, treated as `{ prefix: options }`.
  - `prefix` (`ZodPath`, optional): A key or array of keys prepended to each issue's path. Non-array values are converted to a single-element array. Empty strings are filtered out. Defaults to `""`.
  - `multiline` (`boolean`, optional): When `true` (default), each issue's path appears on its own line below the message. When `false`, the path arrow is placed on the same line as the message.
  - `includeCode` (`boolean`, optional): When `true`, each issue's `code` (if present) is prepended to the message in brackets, e.g. `[custom] message`. Defaults to `false`.

## Returns
- `string`: A prettified, human-readable representation of the error produced by `z.prettifyError`.

# interpretZodIssue
```typescript
function interpretZodIssue(issue: InterpretableZodIssue, options?: ZodPath | InterpretZodErrorOptions): string
```
Convenience wrapper around `interpretZodError` for formatting a single issue. Wraps the issue in a one-element `issues` array and delegates to `interpretZodError`.

## Parameters
- `issue` (`InterpretableZodIssue`): The single issue to interpret.
- `options` (`ZodPath | InterpretZodErrorOptions`, optional): Forwarded directly to `interpretZodError`. See `interpretZodError` for details. Defaults to `""`.

## Returns
- `string`: A prettified, human-readable representation of the single issue.
