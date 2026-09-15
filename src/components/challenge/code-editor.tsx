"use client";

import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import type { Language } from "@/lib/challenge/problems";

/** Reads the site's own tokens, so the editor changes with the theme. */
const theme = EditorView.theme({
  "&": {
    backgroundColor: "transparent",
    color: "var(--foreground)",
    fontSize: "13px",
  },
  ".cm-content": {
    fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
    padding: "1rem 0",
  },
  ".cm-gutters": {
    backgroundColor: "transparent",
    border: "none",
    color: "color-mix(in srgb, var(--muted) 55%, transparent)",
    fontFamily: "var(--font-plex-mono), ui-monospace, monospace",
  },
  ".cm-activeLine": { backgroundColor: "var(--surface)" },
  ".cm-activeLineGutter": { backgroundColor: "var(--surface)" },
  "&.cm-focused": { outline: "none" },
  ".cm-cursor": { borderLeftColor: "var(--accent)" },
  "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, ::selection": {
    backgroundColor: "color-mix(in srgb, var(--accent) 25%, transparent)",
  },
  ".cm-scroller": { overflow: "auto" },
});

export function CodeEditor({
  value,
  language,
  onChange,
  /** Bumped by the caller to force a fresh document (new problem or language). */
  resetKey,
}: {
  value: string;
  language: Language;
  onChange: (next: string) => void;
  resetKey: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);

  // `onChange` is read through a ref so a new callback identity doesn't tear
  // down and rebuild the editor on every parent render. Synced in an effect
  // rather than during render, which React forbids.
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (!host.current) return;

    const instance = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          language === "python" ? python() : javascript(),
          theme,
          EditorView.lineWrapping,
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              onChangeRef.current(update.state.doc.toString());
            }
          }),
        ],
      }),
      parent: host.current,
    });

    view.current = instance;
    return () => {
      instance.destroy();
      view.current = null;
    };
    // `value` is intentionally omitted: it is the initial document only.
    // Re-running on every keystroke would recreate the editor and lose the
    // cursor. `resetKey` is what deliberately rebuilds it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey, language]);

  return (
    <div
      ref={host}
      data-lenis-prevent
      className="min-h-[18rem] [&_.cm-editor]:min-h-[18rem]"
    />
  );
}
