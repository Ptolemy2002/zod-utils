import z from "zod";
import * as zm from "zod/mini";
import { standardAdapter, StandardSchemaV1, zodAdapter, zodFunctionSchema } from "src/index";

const mayTransform = (schema: StandardSchemaV1) => zodAdapter.mayTransform!(schema);

describe("mayTransform (Zod detection)", () => {
    it.each([
        ["primitives", z.string()],
        ["refinements", z.string().min(1).refine(() => true).superRefine(() => {})],
        ["literals and enums", z.union([z.literal("a"), z.enum(["b"])])],
        ["arrays", z.array(z.number())],
        ["objects", z.object({ a: z.string(), b: z.object({ c: z.number() }) })],
        ["objects with a catchall", z.object({}).catchall(z.string())],
        ["tuples with a rest", z.tuple([z.string()], z.number())],
        ["records and maps", z.union([z.record(z.string(), z.number()), z.map(z.string(), z.number())])],
        ["sets", z.set(z.string())],
        ["intersections", z.intersection(z.object({ a: z.string() }), z.object({ b: z.string() }))],
        ["pipes without transforms", z.string().pipe(z.string().min(1))],
        ["wrappers", z.string().optional().nullable().nonoptional()],
        ["lazy schemas", z.lazy(() => z.string())],
        ["discriminated unions", z.discriminatedUnion("t", [z.object({ t: z.literal("a") })])],
        ["zod/mini schemas", zm.object({ a: zm.string().check(zm.minLength(1)) })],
    ])("returns false for %s", (_, schema) => {
        expect(mayTransform(schema)).toBe(false);
    });

    it.each([
        ["transforms", z.string().transform(s => s.length)],
        ["coercion", z.coerce.number()],
        ["overwrite checks", z.string().trim()],
        ["zod/mini overwrite checks", zm.string().check(zm.toLowerCase())],
        ["defaults", z.string().default("a")],
        ["prefaults", z.string().prefault("a")],
        ["catches", z.string().catch("a")],
        ["readonly", z.object({}).readonly()],
        ["codecs", z.codec(z.string(), z.number(), { decode: Number, encode: String })],
        ["preprocessing", z.preprocess(v => v, z.string())],
        ["nested transforms", z.object({ a: z.array(z.tuple([z.string(), z.string().trim()])) })],
        ["transforms in a union option", z.union([z.string(), z.number().transform(String)])],
        ["transforms in a lazy schema", z.lazy(() => z.string().default(""))],
        ["function schemas", zodFunctionSchema()],
    ])("returns true for %s", (_, schema) => {
        expect(mayTransform(schema)).toBe(true);
    });

    it("handles recursive schemas", () => {
        type Tree = { children: Tree[] };
        const tree: z.ZodType<Tree> = z.object({ children: z.lazy(() => z.array(tree)) });
        expect(mayTransform(tree)).toBe(false);

        type TrimmedTree = { name: string; children: TrimmedTree[] };
        const trimmedTree: z.ZodType<TrimmedTree> = z.object({ name: z.string().trim(), children: z.lazy(() => z.array(trimmedTree)) });
        expect(mayTransform(trimmedTree)).toBe(true);
    });

    it("returns true for schemas from other libraries and for unrecognized Zod structures", () => {
        const other: StandardSchemaV1 = { "~standard": { version: 1, vendor: "other", validate: (value) => ({ value }) } };
        expect(mayTransform(other)).toBe(true);

        const noDef: StandardSchemaV1 = { "~standard": { version: 1, vendor: "zod", validate: (value) => ({ value }) } };
        expect(mayTransform(noDef)).toBe(true);

        const unknownType = { "~standard": noDef["~standard"], _zod: { def: { type: "something_new" } } };
        expect(mayTransform(unknownType)).toBe(true);
    });

    it("is shared by the standard adapter", () => {
        expect(standardAdapter.mayTransform!(z.string())).toBe(false);
        expect(standardAdapter.mayTransform!(z.string().trim())).toBe(true);
    });
});
