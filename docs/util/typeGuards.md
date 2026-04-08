# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodError } from 'zod';
// class ZodError extends Error { issues: ZodIssue[]; ... }

import { $ZodError } from 'zod/v4/core';
// class $ZodError extends Error { issues: $ZodIssue[]; ... }
```

# isZodError
```typescript
function isZodError(err: unknown): err is ZodError | $ZodError
```
Returns `true` if `err` is a `ZodError` or `$ZodError` instance, or an `Error` with `name === "ZodError"` or `name === "$ZodError"`. Returns `false` for all other values, including non-Error objects, `null`, and `undefined`. The dual instance and name checks handle cases where a Zod error may have been created in a different module or VM context than the one holding the class reference.

## Parameters
- `err` (`unknown`): The value to test.

## Returns
- `boolean`: `true` if `err` is a `ZodError`, `$ZodError`, or an `Error` with name `"ZodError"` or `"$ZodError"`, `false` otherwise.
