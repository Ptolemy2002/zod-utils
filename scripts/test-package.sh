#! /usr/bin/bash
# Builds and packs the library, installs the tarball into temporary consumer projects (one without
# Zod and one with it), and checks the import paths at runtime and with TypeScript.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TSC="$ROOT/node_modules/.bin/tsc"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

PACKAGE="$(node -p "require('$ROOT/package.json').name")"
ZOD_RANGE="$(node -p "require('$ROOT/package.json').peerDependencies.zod")"
FAILED=0

pass() { echo "  ✓ $1"; }
fail() { echo "  ✗ $1"; FAILED=1; }

# Runs a check and reports it. Usage: check "description" command...
check() {
    local description="$1"; shift
    local output
    if output="$("$@" 2>&1)"; then pass "$description"; else fail "$description"; echo "$output" | sed 's/^/      /'; fi
}

# Passes if the command fails. Usage: check_fails "description" command...
check_fails() {
    local description="$1"; shift
    if "$@" >/dev/null 2>&1; then fail "$description"; else pass "$description"; fi
}

echo "Building and packing the library"
(cd "$ROOT" && npm run build >/dev/null)
TARBALL="$(cd "$ROOT" && npm pack --silent --ignore-scripts --pack-destination "$WORK" | tail -n 1)"
TARBALL="$WORK/$TARBALL"

# Creates a consumer project. Usage: make_consumer dir [extra packages...]
make_consumer() {
    local dir="$1"; shift
    mkdir -p "$dir"
    (cd "$dir" && npm init -y >/dev/null && npm install --no-audit --no-fund --silent "$TARBALL" "$@")
}

# Type-checks a file with each module resolution mode. Usage: check_types dir file
check_types() {
    local dir="$1" file="$2"
    check "$file type-checks with moduleResolution node10" \
        "$TSC" --noEmit --strict --target es2020 --module commonjs --moduleResolution node10 --esModuleInterop "$dir/$file"
    check "$file type-checks with moduleResolution node16" \
        "$TSC" --noEmit --strict --target es2020 --module node16 --moduleResolution node16 "$dir/$file"
    check "$file type-checks with moduleResolution bundler" \
        "$TSC" --noEmit --strict --target es2020 --module esnext --moduleResolution bundler "$dir/$file"
}

CORE_CONSUMER='
import { functionSchema, SchemaValidationError, StandardSchemaV1, validate } from "PACKAGE/core";

const schema: StandardSchemaV1<unknown, string> = {
    "~standard": {
        version: 1,
        vendor: "test",
        validate: (v) => typeof v === "string" ? { value: v } : { issues: [{ message: "Expected a string" }] },
    },
};

const isString: (v: unknown) => v is string = validate(schema);
export { isString, functionSchema, SchemaValidationError };
'

ZOD_CONSUMER='
import * as z from "zod";
import * as root from "PACKAGE";
import { validate } from "PACKAGE/core";
import { zodFunctionSchema, zodValidate } from "PACKAGE/zod";

const fn: (s: string) => number = zodFunctionSchema({ input: z.tuple([z.string()]), output: z.number() })
    .parse((s: string) => s.length);
const ok: boolean = zodValidate(z.string())("x") && validate(z.string())("x") && root.zodValidate(z.string())("x");
export { fn, ok };
'

echo "Consumer without Zod"
NO_ZOD="$WORK/no-zod"
make_consumer "$NO_ZOD"
echo "${CORE_CONSUMER//PACKAGE/$PACKAGE}" > "$NO_ZOD/core-consumer.ts"
cd "$NO_ZOD"
check_fails "zod is not installed" node -e 'require.resolve("zod")'
check "/core loads and works at runtime" node -e "
    const { validate, functionSchema } = require('$PACKAGE/core');
    if (!validate(functionSchema())(() => {})) throw new Error('validation failed');
"
check_fails "/zod fails to load" node -e "require('$PACKAGE/zod')"
check_fails "the root path fails to load" node -e "require('$PACKAGE')"
check_fails "deep imports are blocked" node -e "require('$PACKAGE/dist/core/index.js')"
check_types "$NO_ZOD" core-consumer.ts

echo "Consumer with Zod"
WITH_ZOD="$WORK/with-zod"
make_consumer "$WITH_ZOD" "zod@$ZOD_RANGE"
echo "${ZOD_CONSUMER//PACKAGE/$PACKAGE}" > "$WITH_ZOD/zod-consumer.ts"
cd "$WITH_ZOD"
check "the root path, /core and /zod load at runtime" node -e "
    const z = require('zod');
    const root = require('$PACKAGE');
    const core = require('$PACKAGE/core');
    const zod = require('$PACKAGE/zod');
    if (root.validate !== core.validate || root.zodValidate !== zod.zodValidate) throw new Error('exports differ');
    if (!zod.zodValidate(z.string())('x')) throw new Error('validation failed');
"
check_types "$WITH_ZOD" zod-consumer.ts

if [ "$FAILED" -ne 0 ]; then
    echo "Package test failed"
    exit 1
fi

echo "Package test passed"
