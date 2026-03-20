# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import z from 'zod';
// type z.core.$ZodIssue = { path: PropertyKey[]; message: string; code: string; ... }
```

# prefixZodIssuePath
```typescript
function prefixZodIssuePath(issue: z.core.$ZodIssue, prefix: PropertyKey | PropertyKey[]): z.core.$ZodIssue
```
Prepends a path prefix to a single Zod issue's `path` array, filtering out empty strings and replacing a fully-empty result with `"(root)"`. Returns a new issue object; the original is not mutated.

## Parameters
- `issue` (`z.core.$ZodIssue`): The Zod issue whose path should be prefixed.
- `prefix` (`PropertyKey | PropertyKey[]`): A key or array of keys to prepend to the issue's path. Non-array values are wrapped in a single-element array. Empty strings are filtered out of the final path.

## Returns
- `z.core.$ZodIssue`: A new issue object identical to the input except that `path` is replaced with the prefixed path. If the resulting path is empty, it contains the single string `"(root)"`.
