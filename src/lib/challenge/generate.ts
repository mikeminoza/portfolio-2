import "server-only";

import vm from "node:vm";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import {
  randomProblem,
  type Difficulty,
  type Problem,
  type ProblemSource,
} from "@/lib/challenge/problems";

/**
 * Generates a problem with Claude, then proves it is solvable before serving.
 *
 * A model will occasionally produce a problem whose expected values are wrong.
 * Shipping that means a visitor writes a correct solution and is told it
 * failed — worse than having no AI at all. So the model also returns a
 * reference solution, which is executed against its own test cases here; a
 * problem that cannot pass its own tests is discarded for a curated one.
 */

const MODEL = "claude-opus-5";

/**
 * Generated problems are pooled per difficulty. A single cached problem would
 * make Shuffle return the same thing for the whole TTL; an uncapped pool would
 * bill a call per shuffle. Three is enough variety to feel random, and caps
 * spend at three calls per difficulty per TTL regardless of traffic.
 */
const CACHE_TTL_MS = 30 * 60 * 1000;
const POOL_SIZE = 3;
const cache = new Map<Difficulty, { problems: Problem[]; expires: number }>();

/**
 * In-flight generations, so simultaneous visitors arriving on an expired
 * cache share one request instead of each billing their own.
 */
const inFlight = new Map<Difficulty, Promise<{ problem: Problem; source: ProblemSource }>>();

/** Model-generated code is trusted more than a visitor's, but not much. */
const REFERENCE_TIMEOUT_MS = 1000;

const TestSchema = z.object({
  argsJson: z
    .string()
    .describe("JSON array of the positional arguments, e.g. [[2,7,11,15], 9]"),
  expectedJson: z
    .string()
    .describe("JSON of the exact expected return value, e.g. [0,1]"),
});

const GeneratedSchema = z.object({
  title: z.string().describe("Short problem title, title case"),
  prompt: z
    .string()
    .describe("One or two sentences stating the problem precisely"),
  entry: z
    .string()
    .describe("camelCase function name used in both starters"),
  starterJavaScript: z
    .string()
    .describe("JavaScript function skeleton with an empty body"),
  starterPython: z
    .string()
    .describe("Python function skeleton using 4-space indent and pass"),
  referenceJavaScript: z
    .string()
    .describe("A complete, correct JavaScript solution used only for checking"),
  tests: z.array(TestSchema).min(3).max(5),
});

const INSTRUCTIONS = `You write small, unambiguous coding-interview problems.

Hard requirements:
- The answer must be a single deterministic value: a number, a boolean, a
  string, or a fully ordered array. Never anything order-ambiguous such as
  grouping, set membership, or permutations.
- Every expected value must be exactly what the reference solution returns.
- Both starters declare the same function name and take the same arguments.
- Do not use external libraries or I/O.`;

function parseTests(generated: z.infer<typeof GeneratedSchema>) {
  return generated.tests.map((test) => ({
    args: JSON.parse(test.argsJson) as unknown[],
    expected: JSON.parse(test.expectedJson) as unknown,
  }));
}

/** Numeric-tolerant deep equality, mirroring the client-side runner. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a === "number" && typeof b === "number") {
    return Math.abs(a - b) < 1e-9;
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((item, i) => deepEqual(item, b[i]));
  }
  if (a && b && typeof a === "object" && typeof b === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    return (
      ka.length === kb.length &&
      ka.every((k) =>
        deepEqual(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
        ),
      )
    );
  }
  return a === b;
}

/** Runs the reference solution against its own tests in a fresh context. */
function referencePasses(
  reference: string,
  entry: string,
  tests: { args: unknown[]; expected: unknown }[],
) {
  try {
    const context = vm.createContext(Object.create(null));
    vm.runInContext(reference, context, { timeout: REFERENCE_TIMEOUT_MS });

    for (const test of tests) {
      const call = `(${entry})(...${JSON.stringify(test.args)})`;
      const actual = vm.runInContext(call, context, {
        timeout: REFERENCE_TIMEOUT_MS,
      });
      // Round-trip through JSON so the comparison matches what the browser
      // worker will produce for the visitor.
      if (!deepEqual(JSON.parse(JSON.stringify(actual ?? null)), test.expected)) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
}

export function isGenerationConfigured() {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export async function generateProblem(
  difficulty: Difficulty,
  /** Slug the caller already has, so Shuffle returns something different. */
  excludeSlug?: string,
): Promise<{ problem: Problem; source: ProblemSource }> {
  const fallback = () => ({
    problem: randomProblem(difficulty, excludeSlug),
    source: "fallback" as const,
  });

  if (!isGenerationConfigured()) return fallback();

  const cached = cache.get(difficulty);
  const fresh = cached && cached.expires > Date.now() ? cached : undefined;

  // Serve from the pool once it is full; below that, top it up.
  if (fresh && fresh.problems.length >= POOL_SIZE) {
    const candidates = fresh.problems.filter((p) => p.slug !== excludeSlug);
    const pick = candidates.length ? candidates : fresh.problems;
    return {
      problem: pick[Math.floor(Math.random() * pick.length)],
      source: "ai",
    };
  }

  const pending = inFlight.get(difficulty);
  if (pending) return pending;

  const work = generateOnce(difficulty, fallback);
  inFlight.set(difficulty, work);
  try {
    return await work;
  } finally {
    inFlight.delete(difficulty);
  }
}

async function generateOnce(
  difficulty: Difficulty,
  fallback: () => { problem: Problem; source: ProblemSource },
): Promise<{ problem: Problem; source: ProblemSource }> {
  try {
    const client = new Anthropic();

    const response = await client.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      system: INSTRUCTIONS,
      messages: [
        {
          role: "user",
          content: `Write one ${difficulty} problem. Avoid the most over-used prompts (two sum, fizzbuzz, reverse a string).`,
        },
      ],
      output_config: { format: zodOutputFormat(GeneratedSchema) },
    });

    const generated = response.parsed_output;
    if (!generated) return fallback();

    const tests = parseTests(generated);

    if (!referencePasses(generated.referenceJavaScript, generated.entry, tests)) {
      return fallback();
    }

    const problem: Problem = {
      slug: `ai-${difficulty}-${Date.now()}`,
      title: generated.title,
      difficulty,
      prompt: generated.prompt,
      entry: generated.entry,
      starters: {
        javascript: generated.starterJavaScript,
        python: generated.starterPython,
      },
      tests,
    };

    const existing = cache.get(difficulty);
    const stale = !existing || existing.expires <= Date.now();
    cache.set(difficulty, {
      problems: [...(stale ? [] : existing.problems), problem].slice(-POOL_SIZE),
      // The window starts at the first generation, not the most recent, so a
      // busy difficulty still refreshes its pool on schedule.
      expires: stale ? Date.now() + CACHE_TTL_MS : existing.expires,
    });
    return { problem, source: "ai" };
  } catch {
    // Any failure — no key, rate limit, malformed JSON, network — falls back
    // silently. The visitor gets a working problem either way.
    return fallback();
  }
}
