"use client";

import { useCallback, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { SectionHeading } from "@/components/layout/section-heading";
import { TestResults } from "@/components/challenge/test-results";
import { ActionButton } from "@/components/ui/action";
import { Tag } from "@/components/ui/tag";
import {
  DIFFICULTIES,
  LANGUAGES,
  firstProblem,
  type Difficulty,
  type Language,
  type Problem,
} from "@/lib/challenge/problems";
import { runTests, type RunResult } from "@/lib/challenge/runner";
import { fetchProblem } from "@/lib/challenge/client";
import { cn } from "@/lib/utils";

/*
 * CodeMirror is a few hundred KB and useless on the server, so it is pulled in
 * only once this section renders on the client.
 */
const CodeEditor = dynamic(
  () => import("@/components/challenge/code-editor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <p className="label p-4 text-muted/70">Loading editor…</p>
    ),
  },
);

const DIFFICULTY_TONE: Record<Difficulty, "muted" | "accent"> = {
  easy: "accent",
  medium: "muted",
  hard: "muted",
};

export function ChallengeSection() {
  const [language, setLanguage] = useState<Language>("javascript");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  /*
   * Deterministic on first render. Picking at random here would have the
   * server and the client choose different problems, which fails hydration —
   * and fetching on mount would bill a generation on every page view. The
   * first shuffle or difficulty change is what reaches for a fresh one.
   */
  const [problem, setProblem] = useState<Problem>(() => firstProblem("easy"));
  const [code, setCode] = useState(() => problem.starters.javascript);

  const [result, setResult] = useState<RunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(false);

  // Bumped whenever the document should be replaced wholesale.
  const [editorKey, setEditorKey] = useState(0);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [aiGenerated, setAiGenerated] = useState(false);
  const pythonUsed = useRef(false);

  const load = useCallback(
    (next: Problem, lang: Language) => {
      setProblem(next);
      setCode(next.starters[lang]);
      setResult(null);
      setEditorKey((k) => k + 1);
    },
    [],
  );

  const changeLanguage = (next: Language) => {
    setLanguage(next);
    load(problem, next);
  };

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
    <section
      id="challenge"
      className="mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading index={4} meta="runs in your browser">
        Challenge
      </SectionHeading>

      <p className="mb-8 max-w-2xl text-pretty leading-relaxed text-muted">
        Pick a language and a difficulty, write a solution, and run it against
        the test cases. Everything executes in a worker in your own browser —
        your code is never uploaded.
      </p>

      <div className="mb-6 flex flex-wrap items-center gap-6">
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

      <div className="border border-border">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-medium">{problem.title}</h3>
            <Tag size="sm" treatment="label" tone={DIFFICULTY_TONE[difficulty]}>
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
        </header>

        <p className="border-b border-border px-4 py-3 text-pretty text-sm leading-relaxed text-muted">
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

          <div
            data-lenis-prevent
            className="max-h-[26rem] overflow-y-auto overscroll-contain p-4"
          >
            <TestResults result={result} running={running} booting={booting} />
          </div>
        </div>

        <div className="border-t border-border p-4">
          <ActionButton onClick={run} arrow="right" disabled={running}>
            {running ? "Running" : "Run tests"}
          </ActionButton>
        </div>
      </div>
    </section>
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
