import { generateProblem } from "@/lib/challenge/generate";
import { DIFFICULTIES, type Difficulty } from "@/lib/challenge/problems";

/** Generated per request (behind a cache), so nothing here is prerenderable. */
export const dynamic = "force-dynamic";

function isDifficulty(value: string | null): value is Difficulty {
  return value !== null && (DIFFICULTIES as readonly string[]).includes(value);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const raw = params.get("difficulty");

  if (!isDifficulty(raw)) {
    return Response.json(
      {
        error: {
          code: "invalid_difficulty",
          message: `difficulty must be one of: ${DIFFICULTIES.join(", ")}`,
        },
      },
      { status: 422, headers: { "cache-control": "no-store" } },
    );
  }

  // Optional: the slug the caller already has, so Shuffle moves on.
  const exclude = params.get("exclude") ?? undefined;
  const { problem, source } = await generateProblem(raw, exclude);

  return Response.json(
    { data: problem, source },
    { headers: { "cache-control": "no-store" } },
  );
}
