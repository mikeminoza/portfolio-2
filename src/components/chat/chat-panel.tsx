"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChatBubble, type ChatMessage } from "@/components/chat/chat-message";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import {
  ask as askAssistant,
  OPENING_SUGGESTIONS,
  type AnswerSource,
  type ChatContext,
} from "@/lib/chat";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-layers";

/**
 * Assistant panel.
 *
 * Answers come from Gemini, grounded server-side in the same content the page
 * renders, and fall back to the scripted engine when the API is unconfigured,
 * out of quota or failing. The header states which one answered rather than
 * letting the visitor assume.
 *
 * Open state is owned by the dock, so the trigger can sit beside the other
 * launchers rather than being positioned relative to this panel.
 */
export function ChatPanel({
  context,
  open,
  onClose,
}: {
  context: ChatContext;
  open: boolean;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  /** Which engine answered last — the header says so rather than guessing. */
  const [source, setSource] = useState<AnswerSource | null>(null);

  const { safe } = useMotionSafe();
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEscapeKey(open, onClose);

  const push = useCallback((message: Omit<ChatMessage, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: nextId.current++ }]);
  }, []);

  const ask = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      push({ from: "visitor", text: trimmed });
      setDraft("");
      setThinking(true);

      try {
        const reply = await askAssistant(trimmed, context);
        setSource(reply.source);
        push({
          from: "site",
          text: reply.text,
          suggestions: reply.suggestions,
        });
      } finally {
        setThinking(false);
      }
    },
    [context, push],
  );

  // Greet on first open, not on mount — nothing should happen before asking.
  useEffect(() => {
    if (!open || messages.length) return;
    push({
      from: "site",
      text: `Hi — ask me anything about ${context.profile.name.split(" ")[0]}'s work.`,
      suggestions: OPENING_SUGGESTIONS.slice(0, 4),
    });
  }, [open, messages.length, push, context.profile.name]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  /*
   * Keep the newest message in view — including on reopen. Closing unmounts
   * the panel, so the log remounts at scrollTop 0 with `messages` unchanged;
   * without `open` in the deps the effect never fires and the visitor lands
   * back at the start of the conversation.
   */
  useEffect(() => {
    if (!open) return;
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [open, messages, thinking]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="assistant-panel"
          role="dialog"
          aria-label="Ask about this portfolio"
          initial={safe({ opacity: 0, y: 12, scale: 0.98 })}
          animate={safe({ opacity: 1, y: 0, scale: 1 })}
          exit={safe({ opacity: 0, y: 12, scale: 0.98 })}
          transition={{ duration: 0.22, ease }}
          style={{ transformOrigin: "bottom right" }}
          className={cn(
            "fixed bottom-20 right-4 flex h-[min(32rem,70svh)] w-[min(23rem,calc(100vw-2rem))] flex-col border border-border bg-background shadow-2xl md:bottom-24 md:right-8",
            Z.assistant,
          )}
        >
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
            <div>
              <p className="label text-foreground">
                <span className="text-accent">?</span>
                <span className="mx-2 text-muted">/</span>
                Ask
              </p>
              {/*
                The AI label has to follow what actually answered. Calling a
                scripted fallback "AI" would be a lie to the visitor, so the
                fallback says the AI is unavailable instead.
              */}
              <p className="mt-1 font-mono text-[10px] text-muted">
                {source === "scripted"
                  ? "AI unavailable · answering from this site’s content"
                  : "AI assistant · answers only from this site’s content"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="grid size-7 shrink-0 place-items-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
            >
              <span aria-hidden>&times;</span>
            </button>
          </header>

          {/* Lenis cancels wheel events at the root, so this log needs an
              explicit opt-out to scroll. Same reason as the project modal. */}
          <div
            ref={logRef}
            data-lenis-prevent
            role="log"
            aria-live="polite"
            className="scroll-slim min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
          >
            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                message={message}
                onAsk={(q) => void ask(q)}
              />
            ))}
            {thinking && <TypingDots />}
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              void ask(draft);
            }}
            className="flex shrink-0 items-center gap-2 border-t border-border p-3"
          >
            <input
              ref={inputRef}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Ask a question…"
              aria-label="Your question"
              maxLength={200}
              className="min-w-0 flex-1 border border-border bg-transparent px-3 py-2 font-mono text-xs text-foreground outline-none placeholder:text-muted/60 focus:border-accent"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="label shrink-0 border border-border px-3 py-2 text-muted transition-colors enabled:hover:border-accent enabled:hover:text-accent disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TypingDots() {
  return (
    <p className="label text-muted" aria-hidden>
      <span className="inline-flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1 rounded-full bg-accent"
            animate={{ opacity: [0.25, 1, 0.25] }}
            transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </p>
  );
}
