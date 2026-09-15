import type { Language, TestCase } from "@/lib/challenge/problems";

/**
 * Runs visitor code against a problem's test cases.
 *
 * Everything executes in a Web Worker in the visitor's own browser. Nothing
 * is sent anywhere, there is no server to abuse, and a runaway loop costs a
 * terminated worker rather than a deploy. That property is what makes this
 * safe to put on a public page at all.
 */

/*
 * Workers are served from /public as real files. The Python one must be a
 * module worker — Pyodide 314 refuses to run in a classic worker — and a
 * module worker cannot be built from a blob: URL reliably, so both live on
 * disk. The Pyodide version is pinned inside python-runner.js.
 */
const JS_WORKER_URL = "/workers/js-runner.js";
const PYTHON_WORKER_URL = "/workers/python-runner.js";

/** A solution that hangs is the normal failure mode, so budgets are tight. */
const RUN_TIMEOUT_MS = 5_000;
const PYTHON_BOOT_TIMEOUT_MS = 60_000;

export type TestOutcome = {
  index: number;
  passed: boolean;
  args: unknown[];
  expected: unknown;
  actual?: unknown;
  error?: string;
};

export type RunResult =
  | { status: "ok"; outcomes: TestOutcome[] }
  | { status: "error"; message: string }
  | { status: "timeout"; message: string };

/** Numeric-tolerant deep equality: Python's 2.0 must match JavaScript's 2. */
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
      ka.every((key) =>
        deepEqual(
          (a as Record<string, unknown>)[key],
          (b as Record<string, unknown>)[key],
        ),
      )
    );
  }
  return a === b;
}

type WorkerResult = { json?: string; error?: string };

/** Python's runtime is expensive to boot, so the worker outlives a run. */
let pythonWorker: Worker | null = null;

function getPythonWorker() {
  if (!pythonWorker) {
    pythonWorker = new Worker(PYTHON_WORKER_URL, { type: "module" });
  }
  return pythonWorker;
}

/** Called when a run times out — the worker may be stuck in a loop. */
function resetPythonWorker() {
  pythonWorker?.terminate();
  pythonWorker = null;
}

export function runTests({
  language,
  code,
  entry,
  tests,
}: {
  language: Language;
  code: string;
  entry: string;
  tests: TestCase[];
}): Promise<RunResult> {
  const isPython = language === "python";

  // Read warmth before creating the worker — getPythonWorker() creates one as
  // a side effect, which would make every run look warm.
  const cold = isPython && pythonWorker === null;
  const worker = isPython ? getPythonWorker() : new Worker(JS_WORKER_URL);

  // A cold Python boot downloads the runtime, so it gets a longer budget.
  const budget = cold ? PYTHON_BOOT_TIMEOUT_MS : RUN_TIMEOUT_MS;

  return new Promise<RunResult>((resolve) => {
    let settled = false;

    const finish = (result: RunResult) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      worker.onmessage = null;
      worker.onerror = null;
      if (!isPython) worker.terminate();
      resolve(result);
    };

    const timer = setTimeout(() => {
      if (isPython) resetPythonWorker();
      else worker.terminate();
      finish({
        status: "timeout",
        message: `Gave up after ${Math.round(budget / 1000)}s — check for an infinite loop.`,
      });
    }, budget);

    worker.onerror = (event) => {
      finish({ status: "error", message: event.message || "Worker failed." });
    };

    worker.onmessage = (event: MessageEvent) => {
      const data = event.data as
        | { type: "error"; message: string }
        | { type: "done"; results: WorkerResult[] };

      if (data.type === "error") {
        finish({ status: "error", message: data.message });
        return;
      }

      const outcomes: TestOutcome[] = data.results.map((result, index) => {
        const test = tests[index];

        if (result.error) {
          return {
            index,
            passed: false,
            args: test.args,
            expected: test.expected,
            error: result.error,
          };
        }

        let actual: unknown;
        try {
          actual = JSON.parse(result.json ?? "null");
        } catch {
          actual = null;
        }

        return {
          index,
          passed: deepEqual(actual, test.expected),
          args: test.args,
          expected: test.expected,
          actual,
        };
      });

      finish({ status: "ok", outcomes });
    };

    worker.postMessage({ code, entry, tests: tests.map((t) => ({ args: t.args })) });
  });
}
