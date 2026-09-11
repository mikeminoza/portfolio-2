"use client";

import { motion, useReducedMotion } from "motion/react";
import { charIn, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Section title that reveals word by word when it scrolls into view.
 *
 * Same masked-rise treatment as the hero, so headings feel like one family
 * rather than two unrelated effects.
 */
export function SectionHeading({
  children,
  className,
  count,
}: {
  children: string;
  className?: string;
  /** Optional item count rendered as a monospace counter on the right. */
  count?: number;
}) {
  const reduced = useReducedMotion();
  const words = children.split(" ");

  return (
    <header className="mb-14 flex items-baseline justify-between gap-4">
      <h2
        className={cn(
          "text-3xl font-semibold tracking-tight md:text-4xl",
          className,
        )}
      >
        {reduced ? (
          children
        ) : (
          <motion.span
            className="inline-block"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.6 }}
            variants={stagger(0.07)}
            aria-label={children}
          >
            {words.map((word, i) => (
              <span
                key={`${word}-${i}`}
                className="inline-block overflow-hidden pb-[0.12em] align-bottom"
                aria-hidden
              >
                <motion.span className="inline-block" variants={charIn}>
                  {word}
                  {i < words.length - 1 ? " " : ""}
                </motion.span>
              </span>
            ))}
          </motion.span>
        )}
      </h2>

      {typeof count === "number" && (
        <motion.span
          initial={reduced ? undefined : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.35 }}
          className="font-mono text-xs text-muted"
        >
          {String(count).padStart(2, "0")}
        </motion.span>
      )}
    </header>
  );
}
