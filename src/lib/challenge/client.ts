import {
  randomProblem,
  type Difficulty,
  type Problem,
  type ProblemSource,
} from "@/lib/challenge/problems";

/**
 * Fetches a problem from the generator, falling back to the bundled set.
 *
 * The server already falls back when generation is unavailable; this second
 * layer covers the cases the server cannot — offline, a failed deploy, a
 * response that isn't the shape we expect. A visitor should never be left
 * looking at an empty editor.
 */
export async function fetchProblem(
  difficulty: Difficulty,
  excludeSlug?: string,
): Promise<{ problem: Problem; source: ProblemSource }> {
  const local = () => ({
    problem: randomProblem(difficulty, excludeSlug),
    source: "fallback" as const,
  });

  try {
    const query = new URLSearchParams({ difficulty });
    if (excludeSlug) query.set("exclude", excludeSlug);

    const response = await fetch(`/api/challenge?${query}`, {
      cache: "no-store",
    });
    if (!response.ok) return local();

    const payload: unknown = await response.json();
    if (!isProblemPayload(payload)) return local();

    return { problem: payload.data, source: payload.source };
  } catch {
    return local();
  }
}

/** The response crosses a network boundary, so its shape is checked. */
function isProblemPayload(
  value: unknown,
): value is { data: Problem; source: ProblemSource } {
  if (typeof value !== "object" || value === null) return false;
  const { data } = value as { data?: unknown };
  if (typeof data !== "object" || data === null) return false;

  const problem = data as Partial<Problem>;
  return (
    typeof problem.title === "string" &&
    typeof problem.prompt === "string" &&
    typeof problem.entry === "string" &&
    typeof problem.starters?.javascript === "string" &&
    typeof problem.starters?.python === "string" &&
    Array.isArray(problem.tests) &&
    problem.tests.length > 0
  );
}
