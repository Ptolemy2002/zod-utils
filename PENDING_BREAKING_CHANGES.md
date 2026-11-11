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

## Require Zod schemas in `zodValidate` and `zodValidateWithErrors`

**Problem**: Every Zod utility is created from `zodAdapter` with `createSchemaUtils`, and validates through the Standard Schema interface. `zodValidate` and `zodValidateWithErrors` are the exception: they have always accepted any object with a `safeParse` method (`ZodSafeParseable`), which has no Standard Schema interface. So they cannot simply be `zodUtils.validate` and `zodUtils.validateWithErrors`, and they behave differently from their async counterparts, which require a Zod schema.

**Breaking change**: Make `zodValidate` and `zodValidateWithErrors` the members of `zodUtils`, accepting only Zod schemas (`$ZodType`). Code that passes a non-Zod object with only a `safeParse` method stops compiling and fails at runtime. The type parameter also changes from the output type `O` to the schema type `S`, which breaks code that passes it explicitly (e.g. `zodValidate<string>(...)`).

**Current workaround**: In `src/zod/adapter.ts`, `zodValidate` and `zodValidateWithErrors` are separate functions with their original signatures (`<O>(p: ZodSafeParseable<O>, ...)`). They pass the schema through `toStandardSchema`, which returns Standard Schemas unchanged and wraps other objects in a Standard Schema that calls `safeParse`. The `ZodSafeParseable` type in `src/zod/types.ts` is kept for them.

**Reverting the workaround**: Delete `toStandardSchema`, `zodValidate` and `zodValidateWithErrors` from `src/zod/adapter.ts`, and add `validate: zodValidate` and `validateWithErrors: zodValidateWithErrors` back to the destructuring of `zodUtils`. Delete `ZodSafeParseable`, the "objects with only a safeParse method" tests in `test/zod/adapter.test.ts`, and the compatibility notes in `docs/zod/validate.md`, `docs/zod/adapter.md` and `docs/type-reference.md`.
