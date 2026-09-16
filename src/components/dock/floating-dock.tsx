"use client";

import { useState } from "react";
import { ChallengeModal } from "@/components/challenge/challenge-modal";
import { ChatPanel } from "@/components/chat/chat-panel";
import { DockButton } from "@/components/dock/dock-button";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-layers";
import type { ChatContext } from "@/lib/chat";

/**
 * The floating launchers, bottom right.
 *
 * Both triggers live here rather than inside their own features, which is the
 * only way they reliably sit beside each other — a button positioned from
 * inside each panel would have to guess the other's width.
 *
 * Opening one closes the other: the challenge is a full modal, and leaving
 * the chat panel open behind it would trap focus in two places at once.
 */
export function FloatingDock({ context }: { context: ChatContext }) {
  const [openPanel, setOpenPanel] = useState<"chat" | "challenge" | null>(null);

  const toggle = (panel: "chat" | "challenge") =>
    setOpenPanel((current) => (current === panel ? null : panel));

  return (
    <>
      <ChatPanel
        context={context}
        open={openPanel === "chat"}
        onClose={() => setOpenPanel(null)}
      />
      <ChallengeModal
        open={openPanel === "challenge"}
        onClose={() => setOpenPanel(null)}
      />

      <div
        className={cn(
          "fixed bottom-4 right-4 flex items-end gap-2 md:bottom-8 md:right-8",
          Z.assistant,
        )}
      >
        <DockButton
          tooltip="Solve a coding problem"
          onClick={() => toggle("challenge")}
          active={openPanel === "challenge"}
          delay={1.7}
        >
          <CodeIcon />
        </DockButton>

        <DockButton
          label={openPanel === "chat" ? "Close" : "Ask"}
          tooltip={
            openPanel === "chat"
              ? "Close the assistant"
              : "Ask about this portfolio"
          }
          onClick={() => toggle("chat")}
          active={openPanel === "chat"}
          emphasis="solid"
          delay={1.6}
        >
          <span aria-hidden className="text-base leading-none">
            {openPanel === "chat" ? "×" : "?"}
          </span>
        </DockButton>
      </div>
    </>
  );
}

function CodeIcon() {
  return (
    <svg
      aria-hidden
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="square"
      strokeLinejoin="miter"
    >
      <path d="M8 6 2 12l6 6" />
      <path d="m16 6 6 6-6 6" />
    </svg>
  );
}
