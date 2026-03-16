# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodError } from 'zod';
// class ZodError extends Error { issues: ZodIssue[]; ... }
```

# isZodError
```typescript
function isZodError(err: unknown): err is ZodError
```
Returns `true` if `err` is a `ZodError` instance or an `Error` with `name === "ZodError"`. Returns `false` for all other values, including non-Error objects, `null`, and `undefined`. The dual check handles cases where a `ZodError` may have been created in a different module or VM context than the one holding the `ZodError` class reference.

## Parameters
- `err` (`unknown`): The value to test.

## Returns
- `boolean`: `true` if `err` is a `ZodError` or an `Error` with name `"ZodError"`, `false` otherwise.
