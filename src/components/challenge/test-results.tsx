import { Tag } from "@/components/ui/tag";
import { cn } from "@/lib/utils";
import type { RunResult, TestOutcome } from "@/lib/challenge/runner";

const show = (value: unknown) =>
  value === undefined ? "undefined" : JSON.stringify(value);

export function TestResults({
  result,
  running,
  booting,
}: {
  result: RunResult | null;
  running: boolean;
  /** True while Python's runtime is downloading on first use. */
  booting: boolean;
}) {
  if (running) {
    return (
      <p className="label text-muted">
        {booting
          ? "Downloading the Python runtime (first run only)…"
          : "Running…"}
      </p>
    );
  }

  if (!result) {
    return (
      <p className="label text-muted/70">
        Write a solution and run the tests.
      </p>
    );
  }

  if (result.status === "error" || result.status === "timeout") {
    return (
      <div className="border border-border p-3">
        <Tag size="sm" treatment="label">
          {result.status === "timeout" ? "Timed out" : "Error"}
        </Tag>
        <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-foreground">
          {result.message}
        </p>
      </div>
    );
  }

  const passed = result.outcomes.filter((o) => o.passed).length;
  const total = result.outcomes.length;
  const allPassed = passed === total;

  return (
    <div className="space-y-3">
      <p
        className={cn(
          "label",
          allPassed ? "text-accent" : "text-foreground",
        )}
      >
        {passed} / {total} passed
      </p>

      <ol className="space-y-2">
        {result.outcomes.map((outcome) => (
          <Outcome key={outcome.index} outcome={outcome} />
        ))}
      </ol>
    </div>
  );
}

function Outcome({ outcome }: { outcome: TestOutcome }) {
  return (
    <li
      className={cn(
        "border px-3 py-2 font-mono text-xs leading-relaxed",
        outcome.passed ? "border-accent/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className={cn(
            "shrink-0",
            outcome.passed ? "text-accent" : "text-foreground",
          )}
        >
          {outcome.passed ? "✓" : "✗"}
        </span>
        <span className="min-w-0 break-all text-muted">
          {outcome.args.map(show).join(", ")}
        </span>
      </div>

      {!outcome.passed && (
        <dl className="mt-2 space-y-1 pl-5">
          {outcome.error ? (
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted/60">threw:</dt>
              <dd className="break-all text-foreground">{outcome.error}</dd>
            </div>
          ) : (
            <div className="flex gap-2">
              <dt className="shrink-0 text-muted/60">got:</dt>
              <dd className="break-all text-foreground">
                {show(outcome.actual)}
              </dd>
            </div>
          )}
          <div className="flex gap-2">
            <dt className="shrink-0 text-muted/60">want:</dt>
            <dd className="break-all text-muted">{show(outcome.expected)}</dd>
          </div>
        </dl>
      )}
    </li>
  );
}
