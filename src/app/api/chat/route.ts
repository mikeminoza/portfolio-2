import { askGemini, isGeminiConfigured } from "@/lib/chat/gemini";
import { buildContext } from "@/lib/chat/context";

export const dynamic = "force-dynamic";

/** A question, not an essay. Anything longer is a prompt-stuffing attempt. */
const MAX_QUESTION_LENGTH = 300;

/**
 * Fixed-window throttle. In-memory on purpose — a shared store would be real
 * infrastructure for a portfolio. Serverless instances don't share this, so
 * the limit is per instance: enough to stop a curious visitor burning quota,
 * not a security control.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 15;
const windows = new Map<string, { count: number; resetAt: number }>();

function throttle(key: string) {
  const now = Date.now();
  const current = windows.get(key);

  if (!current || now >= current.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, resetIn: WINDOW_MS / 1000 };
  }

  current.count += 1;

  if (windows.size > 5000) {
    for (const [k, w] of windows) if (now >= w.resetAt) windows.delete(k);
  }

  return {
    allowed: current.count <= MAX_PER_WINDOW,
    resetIn: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "anon";
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  Response.json(body, {
    status,
    headers: { "cache-control": "no-store", ...headers },
  });

export async function POST(request: Request) {
  if (!isGeminiConfigured()) {
    // Not an error: the client falls back to the scripted engine.
    return json({ source: "unavailable", reason: "not_configured" }, 503);
  }

  const limit = throttle(clientKey(request));
  if (!limit.allowed) {
    return json({ source: "unavailable", reason: "rate_limited" }, 429, {
      "retry-after": String(limit.resetIn),
    });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Body must be valid JSON." }, 400);
  }

  const question = (body as { question?: unknown })?.question;

  if (typeof question !== "string" || !question.trim()) {
    return json({ error: "`question` is required." }, 422);
  }

  if (question.length > MAX_QUESTION_LENGTH) {
    return json(
      { error: `\`question\` must be at most ${MAX_QUESTION_LENGTH} characters.` },
      422,
    );
  }

  // Context is read server-side rather than accepted from the client, so a
  // caller can't rewrite the facts the model answers from.
  const result = await askGemini(question.trim(), await buildContext());

  return result.ok
    ? json({ source: "gemini", text: result.text })
    : json({ source: "unavailable", reason: result.reason }, 502);
}
