import {
    $ZodArrayDef, $ZodCheck, $ZodIntersectionDef, $ZodLazyDef, $ZodMapDef, $ZodNonOptionalDef, $ZodNullableDef,
    $ZodObjectDef, $ZodOptionalDef, $ZodPipeDef, $ZodRecordDef, $ZodSetDef, $ZodTupleDef, $ZodType, $ZodTypeDef,
    $ZodUnionDef
} from "zod/v4/core";
import { StandardSchemaV1 } from "src/core/types";

type ZodSchemaType = $ZodTypeDef["type"];

// Types that always change the value (or may replace it), regardless of their children.
const TRANSFORMING_TYPES = new Set<ZodSchemaType>([
    "transform", "default", "prefault", "catch", "readonly", "success", "function", "promise",
]);

// Types with no child schemas that never change the value (unless coerced or given an overwrite check).
const LEAF_TYPES = new Set<ZodSchemaType>([
    "any", "unknown", "never", "void", "undefined", "null", "nan", "boolean", "string", "number", "int",
    "bigint", "symbol", "date", "literal", "enum", "file", "template_literal", "custom",
]);

function isOverwriteCheck(check: $ZodCheck<never>): boolean {
    return check._zod.def.check === "overwrite";
}

function present(...schemas: ($ZodType | null | undefined)[]): $ZodType[] {
    return schemas.filter((schema): schema is $ZodType => schema !== undefined && schema !== null);
}

/** The child schemas of a container type, or `undefined` if the type is not recognized. */
function childSchemas(def: $ZodTypeDef): $ZodType[] | undefined {
    switch (def.type) {
        case "array": return [(def as $ZodArrayDef).element];
        case "object": {
            const { shape, catchall } = def as $ZodObjectDef;
            return present(...Object.values(shape), catchall);
        }
        case "tuple": {
            const { items, rest } = def as $ZodTupleDef;
            return present(...items, rest);
        }
        case "record": {
            const { keyType, valueType } = def as $ZodRecordDef;
            return [keyType, valueType];
        }
        case "map": {
            const { keyType, valueType } = def as $ZodMapDef;
            return [keyType, valueType];
        }
        case "set": return [(def as $ZodSetDef).valueType];
        case "union": return [...(def as $ZodUnionDef).options];
        case "intersection": {
            const { left, right } = def as $ZodIntersectionDef;
            return [left, right];
        }
        case "pipe": {
            const { in: input, out } = def as $ZodPipeDef;
            return [input, out];
        }
        case "lazy": return [(def as $ZodLazyDef).getter()];
        case "optional": return [(def as $ZodOptionalDef).innerType];
        case "nullable": return [(def as $ZodNullableDef).innerType];
        case "nonoptional": return [(def as $ZodNonOptionalDef).innerType];
        default: return undefined;
    }
}

function walk(schema: $ZodType, seen: Set<$ZodType>): boolean {
    // A recursive schema already being checked contributes nothing new.
    if (seen.has(schema)) return false;
    seen.add(schema);

    const def = schema._zod.def;
    if ("coerce" in def && def.coerce === true) return true;
    if (def.checks?.some(isOverwriteCheck)) return true;
    // Codecs are pipes with a transform function.
    if (def.type === "pipe" && "transform" in def) return true;
    if (TRANSFORMING_TYPES.has(def.type)) return true;
    if (LEAF_TYPES.has(def.type)) return false;

    // Unrecognized types are assumed to possibly transform.
    const children = childSchemas(def);
    return children === undefined || children.some(child => walk(child, seen));
}

/**
 * Returns `false` only if `schema` is a Zod schema known to never change the value it validates (no
 * transforms, coercions, defaults, catches, overwrite checks such as `.trim()`, ...). Any other schema
 * is assumed to possibly transform, and returns `true`.
 */
export function zodMayTransform(schema: StandardSchemaV1): boolean {
    if (!(schema instanceof $ZodType)) return true;
    return walk(schema, new Set());
}
