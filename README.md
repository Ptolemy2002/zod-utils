# Zod Utils
Various utilities for working with Zod schemas and, through the [Standard Schema](https://standardschema.dev) interface, any other schema library that implements it (Valibot, ArkType, Effect Schema, ...).

The utilities are built on a small adapter layer: each supported library provides a `SchemaAdapter`, and `createSchemaUtils` turns it into the full set of utilities. The library-neutral versions are exported without a prefix (`validate`, `functionSchema`, ...), and the Zod versions with a `zod` prefix (`zodValidate`, `zodFunctionSchema`, ...).

## Table of Contents
- [Type Reference](docs/type-reference.md) - Complete type definitions for all exported types
- `core` - Library-neutral utilities that work with any Standard Schema
  - [adapter](docs/core/adapter.md) - The `SchemaAdapter` contract, `createSchemaUtils`, and the library-neutral `standardAdapter`
  - [validate](docs/core/validate.md) - Schema-wrapping factories for creating validators (sync and async)
  - [function](docs/core/function.md) - Validated function wrappers and function schemas with trials (sync and async)
  - [interpret](docs/core/interpret.md) - Utilities for formatting validation errors as strings
  - [path](docs/core/path.md) - Utilities for normalizing, comparing, and prefixing issue paths
  - [error](docs/core/error.md) - `SchemaValidationError`, `AsyncSchemaError`, and related type guards
- `zod` - Zod-specific utilities and the Zod adapter
  - [adapter](docs/zod/adapter.md) - The Zod adapter, `zodUtils`, and compatibility aliases
  - [validate](docs/zod/validate.md) - Zod versions of the validator factories
  - [function](docs/zod/function.md) - Zod versions of the function utilities
  - [clone](docs/zod/clone.md) - Utility for cloning Zod schemas without affecting the original
  - [typeGuards](docs/zod/typeGuards.md) - Type guards for Zod-related values

## Pending Breaking Changes
Breaking changes that would improve the library, but are not worth a major release by themselves, are tracked in [PENDING_BREAKING_CHANGES.md](./PENDING_BREAKING_CHANGES.md) along with the non-breaking workarounds currently in place for them. They will be made in the next major release.

## Dependencies
- `@standard-schema/spec` (types only)

## Peer Dependencies
- `zod^4.3.6`

## Commands
The following commands exist in the project:

- `npm run uninstall` - Uninstalls all dependencies for the library
- `npm run reinstall` - Uninstalls and then Reinstalls all dependencies for the library
- `npm run build` - Builds the library
- `npm run release` - Publishes the library to npm without changing the version
- `npm run release-patch` - Publishes the library to npm with a patch version bump
- `npm run release-minor` - Publishes the library to npm with a minor version bump
- `npm run release-major` - Publishes the library to npm with a major version bump
- `npm run test` - Runs the tests for the library
- `npm run test:coverage` - Runs the tests for the library and generates a coverage report
- `npm run test:watch` - Runs the tests for the library in watch mode
- `npm run typecheck` - Identifies any type errors in the library

## Testing Guide

This library uses [Jest](https://jestjs.io/) with [ts-jest](https://kulshekhar.github.io/ts-jest/) for testing TypeScript code.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

Test files are located in `./test` and any `__tests__` directories within the `./src` directory. Generally, test files should be named with a `.test.ts` suffix.