import { StandardSchemaV1 } from "src/core/types";

// Zod-aware transform detection, done structurally (by reading `schema._zod.def`) rather than by
// importing Zod, so that it also works for Zod schemas passed to the library-neutral utilities
// and `/core` keeps working without Zod installed.

type ZodDefLike = { readonly type: string; readonly [key: string]: unknown };

// Types that always change the value (or may replace it), regardless of their children.
const TRANSFORMING_TYPES = new Set([
    "transform", "default", "prefault", "catch", "readonly", "success", "function", "promise",
]);

// Types with no child schemas that never change the value (unless coerced or given an overwrite check).
const LEAF_TYPES = new Set([
    "any", "unknown", "never", "void", "undefined", "null", "nan", "boolean", "string", "number",
    "bigint", "symbol", "date", "literal", "enum", "file", "template_literal", "custom",
]);

function zodDef(value: unknown): ZodDefLike | undefined {
    if (typeof value !== "object" || value === null) return undefined;
    const def = (value as { _zod?: { def?: unknown } })._zod?.def;
    if (typeof def !== "object" || def === null) return undefined;
    return def as ZodDefLike;
}

function isOverwriteCheck(check: unknown): boolean {
    return zodDef(check)?.["check"] === "overwrite";
}

function present(...values: unknown[]): unknown[] {
    return values.filter(value => value !== undefined && value !== null);
}

/** The child schemas of a container type, or `undefined` if the type is not recognized. */
function childSchemas(def: ZodDefLike): unknown[] | undefined {
    switch (def.type) {
        case "array": return [def["element"]];
        case "object": return present(...Object.values(def["shape"] as object), def["catchall"]);
        case "tuple": return present(...(def["items"] as unknown[]), def["rest"]);
        case "record":
        case "map": return [def["keyType"], def["valueType"]];
        case "set": return [def["valueType"]];
        case "union": return def["options"] as unknown[];
        case "intersection": return [def["left"], def["right"]];
        case "pipe": return [def["in"], def["out"]];
        case "lazy": return [(def["getter"] as () => unknown)()];
        case "optional":
        case "nullable":
        case "nonoptional": return [def["innerType"]];
        default: return undefined;
    }
}

function zodWalk(schema: unknown, seen: Set<unknown>): boolean {
    // A recursive schema already being checked contributes nothing new.
    if (seen.has(schema)) return false;
    seen.add(schema);

    const def = zodDef(schema);
    // Not something recognized, so assume it may transform.
    if (!def || typeof def.type !== "string") return true;

    if (def["coerce"] === true) return true;
    if (Array.isArray(def["checks"]) && def["checks"].some(isOverwriteCheck)) return true;
    // Codecs are pipes with a transform function.
    if (def.type === "pipe" && def["transform"] !== undefined) return true;
    if (TRANSFORMING_TYPES.has(def.type)) return true;
    if (LEAF_TYPES.has(def.type)) return false;

    const children = childSchemas(def);
    return children === undefined || children.some(child => zodWalk(child, seen));
}

/**
 * Returns `false` only if `schema` is known to never change the value it validates (no transforms,
 * coercions, defaults, catches, overwrite checks such as `.trim()`, ...). Only Zod schemas can be
 * inspected; any other schema is assumed to possibly transform, and returns `true`.
 */
export function mayTransform(schema: StandardSchemaV1): boolean {
    if (schema["~standard"].vendor !== "zod") return true;
    return zodWalk(schema, new Set());
}
