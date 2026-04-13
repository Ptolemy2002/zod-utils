# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type InterpretableZodIssue = Readonly<{
    message: string;
    path?: PropertyKey[];
}>;
```

# prefixZodIssuePath
```typescript
function prefixZodIssuePath<I extends InterpretableZodIssue>(issue: I, prefix: PropertyKey | PropertyKey[]): I
```
Prepends a path prefix to a single issue's `path` array, filtering out empty strings. Returns a new issue object of the same type; the original is not mutated. If `path` is absent on the input issue, it is treated as an empty array.

## Parameters
- `issue` (`I extends InterpretableZodIssue`): The issue whose path should be prefixed. Any object with a `message` string and an optional `path` array is accepted, including `z.core.$ZodIssue` instances.
- `prefix` (`PropertyKey | PropertyKey[]`): A key or array of keys to prepend to the issue's path. Non-array values are wrapped in a single-element array. Empty strings are filtered out of the final path.

## Returns
- `I`: A new issue object identical to the input except that `path` is replaced with the prefixed path. If the resulting path is empty, it contains the single string `"(root)"`.
