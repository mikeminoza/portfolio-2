"use client";

import { motion, useReducedMotion } from "motion/react";
import { charIn, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Word-by-word reveal. Each word sits in an overflow-hidden box so the
 * text rises out of nothing rather than fading in place.
 *
 * Splits on words, not characters — screen readers still get the whole
 * string because the source text stays in document order.
 */
export function SplitText({
  text,
  className,
  delay = 0,
  gap = 0.055,
}: {
  text: string;
  className?: string;
  delay?: number;
  gap?: number;
}) {
  const reduced = useReducedMotion();
  const words = text.split(" ");

  if (reduced) return <span className={className}>{text}</span>;

  return (
    <motion.span
      className={cn("inline-block", className)}
      initial="hidden"
      animate="visible"
      variants={stagger(gap, delay)}
      aria-label={text}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="inline-block overflow-hidden pb-[0.12em] align-bottom"
          aria-hidden
        >
          <motion.span className="inline-block" variants={charIn}>
            {word}
            {i < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}
