"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { answer, OPENING_SUGGESTIONS, type ChatContext } from "@/lib/chat";
import { cn } from "@/lib/utils";

type Message = {
  id: number;
  from: "visitor" | "site";
  text: string;
  suggestions?: string[];
};

/**
 * Floating assistant. Answers come from `lib/chat.ts`, which reads the same
 * content the page renders — so it can't contradict the CV.
 *
 * It is scripted, not a language model, and the header says so. Letting a
 * visitor believe otherwise would be the wrong kind of surprise.
 */
export function ChatWidget({ context }: { context: ChatContext }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [thinking, setThinking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const reduced = useReducedMotion();
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const push = useCallback((message: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...message, id: nextId.current++ }]);
  }, []);

  const ask = useCallback(
    (question: string) => {
      const trimmed = question.trim();
      if (!trimmed) return;

      push({ from: "visitor", text: trimmed });
      setDraft("");
      setThinking(true);

      const reply = answer(trimmed, context);
      // A beat before replying reads as considered; instant reads as canned.
      const timer = setTimeout(
        () => {
          setThinking(false);
          push({ from: "site", text: reply.text, suggestions: reply.suggestions });
        },
        reduced ? 0 : 380,
      );
      timers.current.push(timer);
    },
    [context, push, reduced],
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

  // Focus the field when the panel opens.
  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Keep the newest message in view.
  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, thinking]);

  // Escape closes and returns focus to the trigger.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Don't fire a reply into an unmounted tree.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            role="dialog"
            aria-label="Ask about this portfolio"
            initial={reduced ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            animate={reduced ? undefined : { opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: "bottom right" }}
            className="fixed bottom-20 right-4 z-[70] flex h-[min(32rem,70svh)] w-[min(23rem,calc(100vw-2rem))] flex-col border border-border bg-background shadow-2xl md:bottom-24 md:right-8"
          >
            <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div>
                <p className="label text-foreground">
                  <span className="text-accent">?</span>
                  <span className="mx-2 text-muted">/</span>
                  Ask
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Scripted answers from this site&rsquo;s content
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  triggerRef.current?.focus();
                }}
                aria-label="Close"
                className="grid size-7 shrink-0 place-items-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden>&times;</span>
              </button>
            </header>

            {/* Same reason as the project modal: Lenis cancels wheel events
                at the root, so this log needs an explicit opt-out to scroll. */}
            <div
              ref={logRef}
              data-lenis-prevent
              role="log"
              aria-live="polite"
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4"
            >
              {messages.map((message) => (
                <Bubble key={message.id} message={message} onAsk={ask} />
              ))}
              {thinking && (
                <p className="label text-muted" aria-hidden>
                  <Dots />
                </p>
              )}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                ask(draft);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
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

      <motion.button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close assistant" : "Ask about this portfolio"}
        initial={reduced ? undefined : { opacity: 0, scale: 0.8 }}
        animate={reduced ? undefined : { opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.6 }}
        whileHover={reduced ? undefined : { y: -2 }}
        className={cn(
          "label fixed bottom-4 right-4 z-[70] flex items-center gap-2 border px-4 py-3 transition-colors md:bottom-8 md:right-8",
          open
            ? "border-accent bg-background text-accent"
            : "border-foreground bg-foreground text-background hover:border-accent hover:bg-accent",
        )}
      >
        <span aria-hidden className="text-base leading-none">
          {open ? "×" : "?"}
        </span>
        {open ? "Close" : "Ask"}
      </motion.button>
    </>
  );
}

function Bubble({
  message,
  onAsk,
}: {
  message: Message;
  onAsk: (question: string) => void;
}) {
  const fromVisitor = message.from === "visitor";

  return (
    <div className={cn("flex flex-col gap-2", fromVisitor && "items-end")}>
      <div
        className={cn(
          "max-w-[85%] border px-3 py-2 text-sm leading-relaxed",
          fromVisitor
            ? "border-accent/40 bg-surface text-foreground"
            : "border-border text-muted",
        )}
      >
        {message.text.split("\n\n").map((paragraph, i) => (
          // Single newlines are meaningful here (one social link per line),
          // so they render as breaks rather than collapsing to spaces.
          <p key={i} className={cn("whitespace-pre-line", i > 0 && "mt-2")}>
            {linkify(paragraph)}
          </p>
        ))}
      </div>

      {message.suggestions && message.suggestions.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {message.suggestions.map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                onClick={() => onAsk(suggestion)}
                className="border border-border px-2 py-1 font-mono text-[11px] text-muted transition-colors hover:border-accent hover:text-accent"
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Turn bare URLs in an answer into real links. */
function linkify(text: string) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);

  return parts.map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noreferrer"
        className="break-all text-accent underline underline-offset-2"
      >
        {prettyUrl(part)}
      </a>
    ) : (
      part
    ),
  );
}

/** Display form of a URL: scheme dropped, percent-escapes decoded. */
function prettyUrl(url: string) {
  const bare = url.replace(/^https?:\/\//, "");
  try {
    return decodeURI(bare);
  } catch {
    // Malformed escapes make decodeURI throw; the raw form still reads fine.
    return bare;
  }
}

function Dots() {
  return (
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
  );
}
