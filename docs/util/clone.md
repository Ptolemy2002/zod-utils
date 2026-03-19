# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
import { ZodType } from 'zod';
```

# zodClone
```typescript
function zodClone<T extends ZodType>(schema: T): T
```
Creates a shallow copy of a Zod schema so that subsequent metadata modifications (e.g. adding refinements or transforms) do not affect the original. Uses `refine(() => true)` internally to produce a new schema instance that preserves the original's validation behavior.

## Parameters
- `schema` (`T`): The Zod schema to clone.

## Returns
- `T`: A new schema instance that behaves identically to the input but is a distinct object reference.
