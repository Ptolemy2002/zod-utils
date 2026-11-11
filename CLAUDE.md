This project is part of a git repository, and the folder this file is in is the root. Do not assume that the repository is in any path other than this one.

The project is a TypeScript library with all source files in `./src` and all test files in `./test` (and any `__tests__` directories within `./src`). Before attempting to explore the codebase, run `ls` on these folders specifically to get a sense of the file structure and avoid needing to read more than necessary in your exploration. The codebase contains some folders with multiple files and one `index.ts` file that exports the contents of the folder. For this reason, `index.ts` is generally unnecessary to read.

`./src/index.ts` is the entry point of the library and exports all of the subfolders (except `internal`), so any public component can be imported directly from there.

Library-neutral code lives in `./src/core` (with most types in `./src/core/types.ts`), and Zod-specific code lives in `./src/zod` (with Zod type aliases in `./src/zod/types.ts`). Each supported schema library gets a `SchemaAdapter` (see `./src/core/adapter.ts`), and its exports are created with `createSchemaUtils`. Shared implementation details live in `./src/internal`. Some types are exported directly from their respective files.

The package has three import paths, defined by `exports` in `./package.json`: the root (everything), `/core` (`./src/core`) and `/zod` (`./src/zod`). `/core` must work without Zod installed, so nothing in `./src/core` or `./src/internal` may import Zod. `./test/core/noZod.test.ts` enforces this. If you add or change an import path, update `exports` and `typesVersions` in `./package.json`, and run `npm run test:package`.

The folder `./docs` should contain documentation for every public component (Table of contents in `./README.md`), so reading the relevant parts of that is a good way to get an overview without needing to search specific sections. You may be given a task in a state where there are currently unstaged changes or untracked files, in which case the docs may not be up to date. If you need to check for any additions, use `git status` and `git diff`. If you update any `Type Reference` section, search for other references to that type in the `docs` folder, as docs files redundantly list relevant types at the top of them for ease of reference, so you will need to update those as well.

If you find yourself needing to write a new docs file, read `./DOCS_GUIDE.md` for detailed instructions on file placement, structure, and formatting conventions.

The tests aim for 100% collective test coverage. They are organized similarly to `src` (`./test/core` and `./test/zod`), but not exactly. Individual test files may not cover all functionality, because the functionality may be provided by another component with its own tests in other files. So, don't try to write tests that cover every possible case, since that will likely end up being redundant.

You can run `npm run test` to run all tests, and `npm run test:coverage` to run tests with a coverage report. In most cases, the printed coverage report in the terminal is sufficient, but if you want to see the detailed report, you can see `./coverage/index.html`. Run `npm run typecheck` to check types, and `npm run test:package` to check the packed library's import paths (this builds the library and installs it into temporary projects, so it is slower and needs network access).

`./PENDING_BREAKING_CHANGES.md` is a running list of breaking changes that are being deferred until a major release, along with the non-breaking workarounds currently in place for them. If you implement such a workaround, add an entry there. If you are making a major release, implement the pending changes and revert their workarounds as described there.
