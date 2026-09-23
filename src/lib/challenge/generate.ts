import "server-only";

import vm from "node:vm";
import { after } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import {
  randomProblem,
  type Difficulty,
  type Problem,
  type ProblemSource,
  type TestCase,
} from "@/lib/challenge/problems";

/**
 * Generates coding problems with Gemini, off the request path.
 *
 * **Nobody ever waits for the model.** A generation takes ten to fifteen
 * seconds, which is far too long to hold a Shuffle click. So a request is
 * only ever served from the pool, instantly, and falls back to the curated
 * set when the pool is empty; filling the pool happens in the background via
 * `after`, and lands in time for the next click. The first visitor in a
 * window gets a curated problem and pays nothing for it; everyone after them
 * gets a generated one with no spinner at all.
 *
 * The pool is filled one batch at a time rather than one problem at a time.
 * Three problems in a single response cost one request instead of three,
 * which matters against a free tier of twenty a day, and the pool goes from
 * empty to full in one round trip.
 *
 * Shares `GEMINI_API_KEY` with the chat assistant — one provider to configure
 * rather than two.
 */

/**
 * Overridable because Google retires and renames model ids on its own
 * schedule — a hardcoded one turns into a 404 months later.
 */
const MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";

/**
 * Thinking is left on, unlike the chat assistant. Inventing a problem *and* a
 * correct reference solution *and* exact expected values is reasoning work,
 * and the cheapest way to fail the `node:vm` check below is to skip it.
 * Budgeted rather than unbounded because thinking tokens are charged against
 * `maxOutputTokens`, and an over-thought request would truncate the JSON.
 */
const THINKING_BUDGET = 4096;
const MAX_OUTPUT_TOKENS = 16384;

/** High enough that Shuffle feels varied; the vm check catches the misses. */
const TEMPERATURE = 0.8;

/**
 * Nobody is blocked on this, so the batch gets room to finish — but it still
 * has to land inside the route's `maxDuration`, or the platform kills the
 * instance mid-flight and the pool is left empty with the quota already spent.
 */
const GENERATION_TIMEOUT_MS = 45_000;

/**
 * Generated problems are pooled per difficulty. A single cached problem would
 * make Shuffle return the same thing for the whole TTL; an uncapped pool would
 * bill a call per shuffle. Three is enough variety to feel random, and caps
 * spend at three calls per difficulty per TTL regardless of traffic.
 *
 * The window is hours, not minutes, because Gemini's free tier allows only
 * 20 generate_content requests per day. Filling all three pools already costs
 * nine, and each serverless instance keeps its own cache — a short TTL spends
 * the whole daily quota before lunch and then serves nothing but fallbacks.
 * Shorten it if the key is on a paid tier.
 */
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const POOL_SIZE = 3;
const cache = new Map<Difficulty, { problems: Problem[]; expires: number }>();

/**
 * In-flight fills, so a burst of visitors arriving on an empty pool schedules
 * one batch between them rather than one each.
 */
const inFlight = new Map<Difficulty, Promise<void>>();

/** Model-generated code is trusted more than a visitor's, but not much. */
const REFERENCE_TIMEOUT_MS = 1000;

/**
 * Inputs only. The model is not asked what the answer is — see `deriveTests`.
 */
const TestSchema = z.object({
  argsJson: z
    .string()
    .describe("JSON array of the positional arguments, e.g. [[2,7,11,15], 9]"),
});

const GeneratedSchema = z.object({
  title: z.string().describe("Short problem title, title case"),
  prompt: z
    .string()
    .describe("One or two sentences stating the problem precisely"),
  entry: z
    // Anchored because the model has returned "(matrix)" and
    // "function entry(grid)" here; both would build a broken call expression.
    .string()
    .regex(/^[A-Za-z_$][A-Za-z0-9_$]*$/)
    .describe("Bare camelCase function name, e.g. countVowels"),
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

/**
 * A whole pool in one response. `min(1)` rather than `min(POOL_SIZE)` so a
 * batch that comes back one short still parses — two usable problems beat
 * discarding all three over a schema technicality.
 */
const BatchSchema = z.object({
  problems: z.array(GeneratedSchema).min(1).max(POOL_SIZE),
});

/**
 * Gemini constrains decoding to a JSON Schema, so the zod schema above is the
 * single source of truth for both the wire format and the runtime check.
 * `$schema` is stripped because the API rejects the meta-schema key.
 */
const RESPONSE_SCHEMA = (() => {
  const json = z.toJSONSchema(BatchSchema) as Record<string, unknown>;
  delete json.$schema;
  return json;
})();

const INSTRUCTIONS = `You write small, unambiguous coding-interview problems.

Output rules:
- "entry" is a bare camelCase identifier, e.g. countVowels. No parentheses, no
  parameter list, no "function" keyword — just the name.
- "referenceJavaScript" declares exactly that function and nothing else, e.g.
  function countVowels(text) { ... }. It must be complete and correct, use no
  libraries and no I/O, and contain NO COMMENTS of any kind.
- Both starters declare the same function name with the same parameters.
- Each "argsJson" is a JSON array of the positional arguments. For a call
  f([1,2], 3) it is [[1,2],3]. A single argument still needs the outer array:
  f("abc") is ["abc"].

Problem rules:
- The problems in a batch must be genuinely different from each other: not the
  same idea restated, and not the same algorithm over a different data type.
- The answer must be a single deterministic value: a number, a boolean, a
  string, or a fully ordered array. Never anything order-ambiguous such as
  grouping, set membership, or permutations.
- Test inputs should cover the edge cases: empty input, a single element, and
  whatever the prompt makes tricky. You supply only the inputs — the expected
  answers are computed by running your reference solution.`;

/**
 * Parses the model's argument lists.
 *
 * `argsJson` is a string the model writes freehand, and it does sometimes
 * write `[1,2], 3` — the arguments, but not as one array. That is not JSON,
 * so it is rejected here rather than becoming a confusing call downstream.
 */
function parseArgsList(
  tests: { argsJson: string }[],
): unknown[][] | null {
  const parsed: unknown[][] = [];
  for (const test of tests) {
    try {
      const args: unknown = JSON.parse(test.argsJson);
      if (!Array.isArray(args)) return null;
      parsed.push(args);
    } catch {
      return null;
    }
  }
  return parsed;
}

/**
 * Computes each test's expected value by running the reference solution.
 *
 * The model used to state the answers itself, and that was the single largest
 * source of broken problems: it writes a sound algorithm and then mispredicts
 * what it returns ("want 102, got 9"). Every one of those had to be thrown
 * away, which on `hard` meant almost all of them.
 *
 * Executing the reference removes the guess. The guarantee is unchanged —
 * the tests are exactly what a correct solution produces — it is just
 * established by running the code rather than by trusting arithmetic the
 * model did in its head.
 *
 * Returns null when the reference cannot be trusted at all: it throws, it
 * loops, it never defines `entry`, or it returns something that will not
 * survive the trip to the browser worker.
 */
function deriveTests(
  reference: string,
  entry: string,
  argsList: unknown[][],
): TestCase[] | null {
  try {
    const context = vm.createContext(Object.create(null));
    vm.runInContext(reference, context, { timeout: REFERENCE_TIMEOUT_MS });

    // A reference that never declared the entry point would otherwise fail
    // once per test with an opaque ReferenceError.
    const declared = vm.runInContext(`typeof ${entry}`, context, {
      timeout: REFERENCE_TIMEOUT_MS,
    });
    if (declared !== "function") return null;

    const tests: TestCase[] = [];
    for (const args of argsList) {
      const call = `(${entry})(...${JSON.stringify(args)})`;
      const actual = vm.runInContext(call, context, {
        timeout: REFERENCE_TIMEOUT_MS,
      });

      // `undefined` means the function fell off the end — a stub, not a
      // solution. Round-tripping matches what the browser worker will
      // compare against, so NaN or a Map is caught here rather than by a
      // visitor whose correct answer is marked wrong.
      if (actual === undefined) return null;
      const expected: unknown = JSON.parse(JSON.stringify(actual));

      tests.push({ args, expected });
    }
    return tests;
  } catch {
    return null;
  }
}

export function isGenerationConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Returns a problem immediately — from the pool if there is one, otherwise
 * from the curated set — and tops the pool up in the background.
 *
 * Deliberately never awaits the model. Holding the response for ten-plus
 * seconds is the one thing that makes Shuffle feel broken, and a curated
 * problem now is worth more than a generated one later.
 */
export async function generateProblem(
  difficulty: Difficulty,
  /** Slug the caller already has, so Shuffle returns something different. */
  excludeSlug?: string,
): Promise<{ problem: Problem; source: ProblemSource }> {
  if (!isGenerationConfigured()) {
    return { problem: randomProblem(difficulty, excludeSlug), source: "fallback" };
  }

  const cached = cache.get(difficulty);
  const pool = cached && cached.expires > Date.now() ? cached.problems : [];

  // Short pool — whether empty or part-filled — earns a background batch.
  if (pool.length < POOL_SIZE) scheduleFill(difficulty);

  if (pool.length === 0) {
    return { problem: randomProblem(difficulty, excludeSlug), source: "fallback" };
  }

  const candidates = pool.filter((p) => p.slug !== excludeSlug);
  const pick = candidates.length ? candidates : pool;
  return {
    problem: pick[Math.floor(Math.random() * pick.length)],
    source: "ai",
  };
}

/**
 * Queues a pool fill that outlives the response.
 *
 * `after` is what keeps the work alive: on a serverless platform the instance
 * can be frozen the moment the body is flushed, which would leave the batch
 * half-done and the quota spent for nothing.
 */
function scheduleFill(difficulty: Difficulty) {
  if (inFlight.has(difficulty)) return;

  const work = fillPool(difficulty).finally(() => inFlight.delete(difficulty));
  inFlight.set(difficulty, work);

  try {
    after(work);
  } catch {
    // No request scope to attach to — a warm-up script, or a test. The work
    // still runs; this only stops a rejection becoming an unhandled one.
    void work.catch(() => {});
  }
}

/** Builds a servable problem, or null if the model's version doesn't hold up. */
function toProblem(
  difficulty: Difficulty,
  generated: z.infer<typeof GeneratedSchema>,
  index: number,
): Problem | null {
  const argsList = parseArgsList(generated.tests);
  if (!argsList) return null;

  const tests = deriveTests(
    generated.referenceJavaScript,
    generated.entry,
    argsList,
  );
  if (!tests) return null;

  return {
    // Index keeps slugs unique within a batch, which all share a timestamp.
    slug: `ai-${difficulty}-${Date.now()}-${index}`,
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
}

function store(difficulty: Difficulty, incoming: Problem[]) {
  const existing = cache.get(difficulty);
  const stale = !existing || existing.expires <= Date.now();

  cache.set(difficulty, {
    problems: [...(stale ? [] : existing.problems), ...incoming].slice(-POOL_SIZE),
    // The window starts at the first generation, not the most recent, so a
    // busy difficulty still refreshes its pool on schedule.
    expires: stale ? Date.now() + CACHE_TTL_MS : existing.expires,
  });
}

/**
 * Asks for a batch and keeps whatever survives verification.
 *
 * Partial success is success: two good problems out of three still fill most
 * of the pool, and throwing them away would mean paying for another request
 * against a twenty-a-day budget.
 */
async function fillPool(difficulty: Difficulty): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return;

  // Belt and braces: the SDK gets the signal, and the timer is cleared on
  // every path so a resolved call cannot leave a handle behind.
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), GENERATION_TIMEOUT_MS);

  try {
    const client = new GoogleGenAI({ apiKey });

    const response = await client.models.generateContent({
      model: MODEL,
      contents: `Write ${POOL_SIZE} different ${difficulty} problems. Avoid the most over-used prompts (two sum, fizzbuzz, reverse a string).`,
      config: {
        systemInstruction: INSTRUCTIONS,
        responseMimeType: "application/json",
        responseJsonSchema: RESPONSE_SCHEMA,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: TEMPERATURE,
        thinkingConfig: { thinkingBudget: THINKING_BUDGET },
        abortSignal: abort.signal,
      },
    });

    // Thinking shares the output budget, so a hit ceiling truncates the JSON
    // mid-token. Parsing that would throw anyway; bailing here is clearer.
    if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") return;

    const text = response.text?.trim();
    if (!text) return;

    // Constrained decoding makes the shape overwhelmingly likely, not
    // certain, so the response is still validated rather than trusted.
    const batch = BatchSchema.safeParse(JSON.parse(text));
    if (!batch.success) return;

    const problems = batch.data.problems
      .map((generated, index) => toProblem(difficulty, generated, index))
      .filter((problem): problem is Problem => problem !== null);

    if (problems.length) store(difficulty, problems);
  } catch {
    // Any failure — rate limit, timeout, malformed JSON, network, a retired
    // model id — leaves the pool as it was. Requests keep serving curated
    // problems, and the next one schedules a fresh attempt.
  } finally {
    clearTimeout(timer);
  }
}
