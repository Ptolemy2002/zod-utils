# Pending Breaking Changes

This is a running list of breaking changes that would improve the library but are not worth a major release by themselves. Each entry also records the workaround currently in place, so the workaround can be removed when the change is finally made.

When this list gets long, or when a change comes along that justifies a major release on its own, implement every entry here in that release, remove its workarounds, and then delete the entry.

## Entry format

Each entry has a `##` heading naming the change, followed by these sections:

- **Problem**: What is wrong with the current design.
- **Breaking change**: The change that fixes it, and what it breaks for users.
- **Current workaround**: What was done instead to avoid the major release, with the files and symbols involved.
- **Reverting the workaround**: What to remove or simplify once the breaking change is made.

---

## Make the root import path library-neutral

**Problem**: The root import path (`@ptolemy2002/zod-utils`) exports the Zod utilities as well as the library-neutral ones, so it requires Zod to be installed even when only the library-neutral utilities are used. As more schema libraries get adapters, the root would have to require every one of them.

**Breaking change**: Make the root export only what `/core` exports. Zod utilities are then only available from `@ptolemy2002/zod-utils/zod`, and code that imports them from the root breaks.

**Current workaround**: `src/index.ts` exports both `./core` and `./zod`. Zod is an optional peer dependency (`peerDependenciesMeta` in `package.json`), and the `/core` import path is available for code that does not use Zod.

**Reverting the workaround**: Change `src/index.ts` to export only `./core` (or make the root's `exports` entry in `package.json` point at `dist/core`). Update the "consumer without Zod" checks in `scripts/test-package.sh` so that the root path is expected to load, and the "Import Paths" section of `README.md`. Update the docs and examples that import Zod utilities from the root.

## Require Zod schemas in `zodValidate` and `zodValidateWithErrors`

**Problem**: Every Zod utility is created from `zodAdapter` with `createSchemaUtils`, and validates through the Standard Schema interface. `zodValidate` and `zodValidateWithErrors` are the exception: they have always accepted any object with a `safeParse` method (`ZodSafeParseable`), which has no Standard Schema interface. So they cannot simply be `zodUtils.validate` and `zodUtils.validateWithErrors`, and they behave differently from their async counterparts, which require a Zod schema.

**Breaking change**: Make `zodValidate` and `zodValidateWithErrors` the members of `zodUtils`, accepting only Zod schemas (`$ZodType`). Code that passes a non-Zod object with only a `safeParse` method stops compiling and fails at runtime. The type parameter also changes from the output type `O` to the schema type `S`, which breaks code that passes it explicitly (e.g. `zodValidate<string>(...)`).

**Current workaround**: In `src/zod/adapter.ts`, `zodValidate` and `zodValidateWithErrors` are separate functions with their original signatures (`<O>(p: ZodSafeParseable<O>, ...)`). They pass the schema through `toStandardSchema`, which returns Standard Schemas unchanged and wraps other objects in a Standard Schema that calls `safeParse`. The `ZodSafeParseable` type in `src/zod/types.ts` is kept for them.

**Reverting the workaround**: Delete `toStandardSchema`, `zodValidate` and `zodValidateWithErrors` from `src/zod/adapter.ts`, and add `validate: zodValidate` and `validateWithErrors: zodValidateWithErrors` back to the destructuring of `zodUtils`. Delete `ZodSafeParseable`, the "objects with only a safeParse method" tests in `test/zod/adapter.test.ts`, and the compatibility notes in `docs/zod/validate.md`, `docs/zod/adapter.md` and `docs/type-reference.md`.
