"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { TestResults } from "@/components/challenge/test-results";
import { ActionButton } from "@/components/ui/action";
import { Tag } from "@/components/ui/tag";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { fetchProblem } from "@/lib/challenge/client";
import {
  DIFFICULTIES,
  LANGUAGES,
  firstProblem,
  type Difficulty,
  type Language,
  type Problem,
} from "@/lib/challenge/problems";
import { runTests, type RunResult } from "@/lib/challenge/runner";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-layers";

/*
 * CodeMirror is a few hundred KB and useless on the server, so it is pulled in
 * only when the modal first opens rather than on page load.
 */
const CodeEditor = dynamic(
  () => import("@/components/challenge/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => <p className="label p-4 text-muted/70">Loading editor…</p>,
  },
);

const DIFFICULTY_TONE: Record<Difficulty, "muted" | "accent"> = {
  easy: "accent",
  medium: "muted",
  hard: "muted",
};

export function ChallengeModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [language, setLanguage] = useState<Language>("javascript");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");

  /*
   * Deterministic first problem. Rolling at random during render would have
   * the server and client disagree and fail hydration, and fetching on mount
   * would bill a generation for every page view.
   */
  const [problem, setProblem] = useState<Problem>(() => firstProblem("easy"));
  const [code, setCode] = useState(() => problem.starters.javascript);

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(false);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);

  // Bumped whenever the document should be replaced wholesale.
  const [editorKey, setEditorKey] = useState(0);
  const pythonUsed = useRef(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { safe } = useMotionSafe();

  useScrollLock(open);
  useEscapeKey(open, onClose);
  useFocusTrap(open, panelRef);

  const load = useCallback((next: Problem, lang: Language) => {
    setProblem(next);
    setCode(next.starters[lang]);
    setResult(null);
    setEditorKey((k) => k + 1);
  }, []);

  /** Asks the server for a fresh problem; falls back locally if it can't. */
  const request = useCallback(
    async (nextDifficulty: Difficulty, lang: Language, exclude?: string) => {
      setLoadingProblem(true);
      try {
        const { problem: next, source } = await fetchProblem(
          nextDifficulty,
          exclude,
        );
        setAiGenerated(source === "ai");
        load(next, lang);
      } finally {
        setLoadingProblem(false);
      }
    },
    [load],
  );

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    load(problem, next);
  };

  const changeDifficulty = (next: Difficulty) => {
    setDifficulty(next);
    void request(next, language);
  };

  const shuffle = () => void request(difficulty, language, problem.slug);

  const reset = () => {
    setCode(problem.starters[language]);
    setResult(null);
    setEditorKey((k) => k + 1);
  };

  const run = async () => {
    setRunning(true);
    // Only the first Python run pays for the runtime download.
    setBooting(language === "python" && !pythonUsed.current);

    try {
      const outcome = await runTests({
        language,
        code,
        entry: problem.entry,
        tests: problem.tests,
      });
      if (language === "python") pythonUsed.current = true;
      setResult(outcome);
    } finally {
      setRunning(false);
      setBooting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          key="challenge-modal"
          className={cn(
            "fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6",
            Z.dialog,
          )}
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={safe({ opacity: 0 })}
            animate={safe({ opacity: 1 })}
            exit={safe({ opacity: 0 })}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="Coding challenge"
            initial={safe({ opacity: 0, y: 24 })}
            animate={safe({ opacity: 1, y: 0 })}
            exit={safe({ opacity: 0, y: 24 })}
            transition={{ duration: 0.28, ease }}
            className="relative flex max-h-[94svh] w-full max-w-5xl flex-col border border-border bg-background sm:max-h-[88svh]"
          >
            <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
              <div>
                <p className="label text-foreground">
                  <span className="text-accent">&lt;/&gt;</span>
                  <span className="mx-2 text-muted">/</span>
                  Challenge
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Runs in a worker in your browser — never uploaded
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden className="text-base leading-none">
                  &times;
                </span>
              </button>
            </header>

            <div
              data-lenis-prevent
              className="scroll-slim min-h-0 flex-1 overflow-y-auto overscroll-contain"
            >
              <div className="flex flex-wrap items-center gap-6 border-b border-border px-5 py-4 md:px-6">
                <Choice
                  label="Language"
                  options={LANGUAGES}
                  value={language}
                  onSelect={changeLanguage}
                />
                <Choice
                  label="Difficulty"
                  options={DIFFICULTIES}
                  value={difficulty}
                  onSelect={changeDifficulty}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-medium">{problem.title}</h3>
                  <Tag
                    size="sm"
                    treatment="label"
                    tone={DIFFICULTY_TONE[difficulty]}
                  >
                    {problem.difficulty}
                  </Tag>
                  {aiGenerated && (
                    <Tag size="sm" treatment="label">
                      AI generated
                    </Tag>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={shuffle}
                    disabled={loadingProblem}
                    className="label text-muted transition-colors hover:text-accent disabled:opacity-40"
                  >
                    {loadingProblem ? "Loading" : "Shuffle"}
                  </button>
                  <button
                    type="button"
                    onClick={reset}
                    className="label text-muted transition-colors hover:text-accent"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <p className="border-b border-border px-5 py-3 text-pretty text-sm leading-relaxed text-muted md:px-6">
                {problem.prompt}
              </p>

              <div className="grid lg:grid-cols-2">
                <div className="border-b border-border lg:border-b-0 lg:border-r">
                  <CodeEditor
                    value={code}
                    language={language}
                    onChange={setCode}
                    resetKey={`${problem.slug}-${language}-${editorKey}`}
                  />
                </div>

                <div className="p-4 md:p-5">
                  <TestResults
                    result={result}
                    running={running}
                    booting={booting}
                  />
                </div>
              </div>
            </div>

            <div className="shrink-0 border-t border-border p-4 md:px-6">
              <ActionButton onClick={run} arrow="right" disabled={running}>
                {running ? "Running" : "Run tests"}
              </ActionButton>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Choice<T extends string>({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onSelect: (next: T) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="label text-muted/70">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === value}
            onClick={() => onSelect(option)}
            className={cn(
              "label border px-3 py-1.5 transition-colors",
              option === value
                ? "border-accent text-accent"
                : "border-border text-muted hover:border-accent hover:text-accent",
            )}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
