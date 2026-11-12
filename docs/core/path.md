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
```

# normalizeIssuePath
```typescript
function normalizeIssuePath(path: ReadonlyArray<PathSegment> | undefined): PropertyKey[]
```
Converts an issue path into a plain array of property keys. The Standard Schema spec allows path segments to be `{ key }` objects, which are replaced with their `key`. An `undefined` path becomes an empty array.

## Parameters
- `path` (`ReadonlyArray<PathSegment> | undefined`): The path to normalize.

## Returns
- `PropertyKey[]`: A new array of property keys.

# issuePathStartsWith
```typescript
function issuePathStartsWith(issuePath: ReadonlyArray<PathSegment> | undefined, prefix: SchemaPath): boolean
```
Checks whether an issue path begins with the given prefix. `{ key }` segments are compared by their `key`, and an `undefined` path is treated as empty.

## Parameters
- `issuePath` (`ReadonlyArray<PathSegment> | undefined`): The issue path to check.
- `prefix` (`SchemaPath`): A key or array of keys. Non-array values are treated as a single-element array.

## Returns
- `boolean`: `true` if every segment of `prefix` equals the segment at the same position in `issuePath` (an empty prefix always matches), `false` otherwise.

# prefixIssuePath
```typescript
function prefixIssuePath<I extends SchemaIssue>(issue: I, prefix: SchemaPath): I & { path: PropertyKey[] }
```
Prepends a path prefix to a single issue's `path`, filtering out empty strings. Returns a new issue object; the original is not mutated. If `path` is absent on the input issue, it is treated as an empty array. `{ key }` segments are normalized to plain keys.

`prefixZodIssuePath` is the same function, kept under its original name.

## Parameters
- `issue` (`I extends SchemaIssue`): The issue whose path should be prefixed. Any object with a `message` string and an optional `path` array is accepted, including Zod issues.
- `prefix` (`SchemaPath`): A key or array of keys to prepend to the issue's path. Non-array values are wrapped in a single-element array. Empty strings are filtered out of the final path.

## Returns
- `I & { path: PropertyKey[] }`: A new issue object identical to the input except that `path` is replaced with the prefixed path. If the resulting path is empty, it contains the single string `"(root)"`.
