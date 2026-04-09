# Zod Utils
Various utilities for working with Zod schemas.

## Table of Contents
- [Type Reference](docs/type-reference.md) - Complete type definitions for all exported types
- `util` - Utilities for working with Zod schemas and errors
  - [clone](docs/util/clone.md) - Utility for cloning Zod schemas without affecting the original
  - [function](docs/util/function.md) - Schema factory for validating callable functions with input/output schemas
  - [interpret](docs/util/interpret.md) - Utilities for formatting Zod errors as strings
  - [issuePathStartsWith](docs/util/issuePathStartsWith.md) - Utility for checking whether a Zod issue path starts with a given prefix
  - [prefixIssuePath](docs/util/prefixIssuePath.md) - Utility for prepending a path prefix to a Zod issue
  - [typeGuards](docs/util/typeGuards.md) - Type guards for Zod-related values
  - [validate](docs/util/validate.md) - Schema-wrapping factories for creating validators

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