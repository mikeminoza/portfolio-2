import {
  answer as scriptedAnswer,
  type ChatAnswer,
  type ChatContext,
} from "@/lib/chat/engine";

export {
  OPENING_SUGGESTIONS,
  type ChatAnswer,
  type ChatContext,
} from "@/lib/chat/engine";

export type AnswerSource = "gemini" | "scripted";

export type Reply = ChatAnswer & { source: AnswerSource };

/**
 * Asks Gemini, falling back to the scripted engine.
 *
 * The fallback is not decoration: it runs with no key, no network and no
 * cost, so an unconfigured deploy, an exhausted quota or a failed request
 * still leaves the visitor with a working assistant rather than an error.
 */
export async function ask(
  question: string,
  context: ChatContext,
): Promise<Reply> {
  const scripted = (): Reply => ({
    ...scriptedAnswer(question, context),
    source: "scripted",
  });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) return scripted();

    const payload: unknown = await response.json();
    const text = (payload as { text?: unknown })?.text;

    if (typeof text !== "string" || !text.trim()) return scripted();

    return {
      text: text.trim(),
      // Follow-ups still come from the scripted engine: they are derived from
      // real content, so they can't point at something that doesn't exist.
      suggestions: scriptedAnswer(question, context).suggestions,
      source: "gemini",
    };
  } catch {
    return scripted();
  }
}
