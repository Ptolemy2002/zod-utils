# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodError } from 'zod';
// class ZodError extends Error { issues: ZodIssue[]; ... }
```

# interpretZodError
```typescript
function interpretZodError(err: ZodError, prefix?: PropertyKey | PropertyKey[]): string
```
Converts a `ZodError` into a human-readable string, optionally prepending a path prefix to every issue. If the resulting path for an issue is empty (because the prefix was empty or consisted entirely of empty strings), the path is replaced with `"(root)"`.

## Parameters
- `err` (`ZodError`): The Zod validation error to interpret.
- `prefix` (`PropertyKey | PropertyKey[]`, optional): A key or array of keys prepended to each issue's path. Non-array values are converted to a single-element array. Empty strings are filtered out. Defaults to `""`.

## Returns
- `string`: A prettified, human-readable representation of the error produced by `z.prettifyError`.
