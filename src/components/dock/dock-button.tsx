"use client";

import { motion } from "motion/react";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import { cn } from "@/lib/utils";

/**
 * A launcher in the floating dock.
 *
 * The tooltip is a plain sibling shown on hover and focus. It is `aria-hidden`
 * because the same words are already on the button's `aria-label` — announcing
 * them twice is worse than not showing them at all.
 */
export function DockButton({
  children,
  label,
  tooltip,
  onClick,
  active = false,
  /** Solid treatment marks the primary launcher. */
  emphasis = "outline",
  delay = 0,
}: {
  children: React.ReactNode;
  /** Visible text, if any. Icon-only buttons pass nothing. */
  label?: string;
  tooltip: string;
  onClick: () => void;
  active?: boolean;
  emphasis?: "solid" | "outline";
  delay?: number;
}) {
  const { safe } = useMotionSafe();

  return (
    <div className="group/dock relative flex">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={tooltip}
        aria-expanded={active}
        initial={safe({ opacity: 0, scale: 0.8 })}
        animate={safe({ opacity: 1, scale: 1 })}
        transition={{ duration: 0.4, delay }}
        whileHover={safe({ y: -2 })}
        className={cn(
          "label flex items-center gap-2 border px-4 py-3 transition-colors",
          active
            ? "border-accent bg-background text-accent"
            : emphasis === "solid"
              ? "border-foreground bg-foreground text-background hover:border-accent hover:bg-accent"
              : "border-border bg-background text-muted hover:border-accent hover:text-accent",
        )}
      >
        {children}
        {label}
      </motion.button>

      <span
        aria-hidden
        className="pointer-events-none absolute bottom-full right-0 mb-2 w-max max-w-[16rem] border border-border bg-background px-2.5 py-1.5 font-mono text-[11px] leading-snug text-muted opacity-0 transition-opacity duration-200 group-hover/dock:opacity-100 group-focus-within/dock:opacity-100"
      >
        {tooltip}
      </span>
    </div>
  );
}
