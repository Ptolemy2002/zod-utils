# Type Reference
The following is a reference to types relevant to the functions listed in this file. The full type reference for the library can be found in [type-reference.md](../type-reference.md).

```typescript
type FunctionValidationFlags = {
    input: boolean;
    output: boolean;
};
```

These functions control, globally, whether the wrappers created by [`validatedFunction`, `validatedFunctionAsync`, `functionSchema` and `functionSchemaAsync`](./function.md) (and their [Zod versions](../zod/function.md)) validate their arguments (`input`) and return values (`output`). Both flags are `true` by default, so every call is validated unless the flags are changed.

The flags are shared by every adapter and import path (root, `/core` and `/zod`), and are read on every call, so changing them also affects wrappers that were created before the change.

When a flag is `false`, the corresponding schema is skipped only if it is known to never change the value, as determined by the adapter's [`mayTransform`](./adapter.md#properties). Schemas that may transform the value (transforms, coercions, defaults, `.trim()`, ...) still run, so the function receives the same arguments and the caller receives the same return value either way. Since running a schema also validates, such schemas still throw on invalid values. Transforms cannot be applied without validation. The check is done once per wrapper and schema, the first time it is needed.

Only Zod schemas can be inspected, by both the Zod and the library-neutral adapter. Schemas from other libraries are assumed to possibly transform, so they always run, and the flags have no effect on them.

Disabling output validation is useful when the project is confirmed to be type-safe and the cost of validating every return value is not worth it. Disabling input validation should only be done when every caller can be trusted to pass valid arguments.

Function schema trials always validate both the input and the output, regardless of these flags, since they are explicit checks of the function's behavior. The parsed function itself still follows the flags.

```typescript
import { setFunctionValidation } from "@ptolemy2002/zod-utils/core";

// Skip output validation in production, but keep validating inputs.
if (process.env.NODE_ENV === "production") setFunctionValidation({ output: false });
```

# getFunctionValidation
```typescript
function getFunctionValidation(): Readonly<FunctionValidationFlags>
```
Returns the current global flags.

## Returns
- `Readonly<FunctionValidationFlags>`: The current flags. The object is frozen; use `setFunctionValidation` to change them.

# setFunctionValidation
```typescript
function setFunctionValidation(flags: Partial<FunctionValidationFlags>): Readonly<FunctionValidationFlags>
```
Updates the global flags. Takes effect immediately, including for existing wrappers.

## Parameters
- `flags` (`Partial<FunctionValidationFlags>`): The flags to change.
  - `input` (`boolean`, optional): Whether to validate the arguments of validated functions. If omitted, keeps its current value.
  - `output` (`boolean`, optional): Whether to validate the return values of validated functions. If omitted, keeps its current value.

## Returns
- `Readonly<FunctionValidationFlags>`: The flags as they were before this call, which can be passed back to `setFunctionValidation` to restore them.

# resetFunctionValidation
```typescript
function resetFunctionValidation(): void
```
Restores both flags to their defaults (`true`).
