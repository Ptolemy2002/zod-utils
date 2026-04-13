# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type ZodPath = PropertyKey | PropertyKey[];
```

# issuePathStartsWith
```typescript
function issuePathStartsWith(issuePath: PropertyKey[], prefix: ZodPath): boolean
```
Checks whether a Zod issue path begins with a given prefix. Returns `true` if every segment of `prefix` matches the corresponding leading segment of `issuePath` and `issuePath` is at least as long as `prefix`. An empty `prefix` always returns `true`.

## Parameters
- `issuePath` (`PropertyKey[]`): The full path of a Zod issue (e.g. `issue.path`).
- `prefix` (`ZodPath`): A single key or array of keys to match against the start of the path.

## Returns
- `boolean`: `true` if `issuePath` starts with all segments of `prefix`, `false` otherwise.
