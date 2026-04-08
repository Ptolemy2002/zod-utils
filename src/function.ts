import z, { ZodArray, ZodError, ZodUnknown } from "zod";
import { $ZodFunctionArgs, $ZodFunctionOut } from "zod/v4/core";
import { isZodError } from "./typeGuards";
import { prefixZodIssuePath } from "./prefixIssuePath";
import isCallable from "is-callable";


export type ZodFunctionParseOptions<In extends $ZodFunctionArgs, Out extends $ZodFunctionOut> = {
    input?: In;
    output?: Out;
    inputPath?: PropertyKey | PropertyKey[];
    outputPath?: PropertyKey | PropertyKey[];
};

function zodFunctionParse<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown,
>(
    func: unknown,
    {
        inputPath="args", outputPath="return",

        input=z.array(z.unknown()) as unknown as In,
        output=z.unknown() as unknown as Out
    }: ZodFunctionParseOptions<In, Out>
) {
    if (!isCallable(func)) {
        throw new ZodError([{
            message: `Expected a callable function, but received ${typeof func}`,
            path: [],
            code: "invalid_type",
            expected: "function"
        }]);
    }

    const functionFactory = z.function({ input, output });
    const wrappedFunction = (setReachedCaller: (v: boolean) => void, ...args: z.infer<In>) => {
        setReachedCaller(true);
        return func(...args);
    };

    return (...args: z.infer<In>) => {
        // This is how we will differentiate between argument and
        // parameter validation errors
        let reachedCaller = false;

        try {
            const implementedFunction = functionFactory.implement(
                ((...args: z.infer<In>) => wrappedFunction((v) => (reachedCaller = v), ...args)) as any
            );

            return implementedFunction(...args as any) as z.infer<Out>;
        } catch (e: unknown) {
            if (isZodError(e)) {
                e = new ZodError(e.issues.map(i => prefixZodIssuePath(i, reachedCaller ? outputPath : inputPath)));
            }

            throw e;
        }
    }
}

export function zodFunctionSchema<
    In extends $ZodFunctionArgs = ZodArray<ZodUnknown>,
    Out extends $ZodFunctionOut = ZodUnknown
>(options: ZodFunctionParseOptions<In, Out> = {}) {
    // Transform the input value using zodFunctionParse
    // so that this schema can be used to validate functions
    return z.any().transform((v, ctx) => {
        try {
            return zodFunctionParse(v, options);
        } catch (e: unknown) {
            if (isZodError(e)) {
                e.issues.forEach(issue => ctx.addIssue(issue as Parameters<typeof ctx.addIssue>[0]));
            }

            return z.NEVER;
        }
    });
}