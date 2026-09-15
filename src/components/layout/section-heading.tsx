"use client";

import { motion } from "motion/react";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import { ease } from "@/lib/motion";

/**
 * Section marker in the technical-editorial idiom: a hairline rule that draws
 * itself, then a numbered monospace label with optional right-aligned meta.
 *
 * Deliberately small. The rule and the number do the organising, so the
 * largest type on the page stays with the content rather than the labels.
 */
export function SectionHeading({
  index,
  children,
  meta,
}: {
  /** Section number, rendered zero-padded. */
  index: number;
  children: string;
  /** Right-aligned detail, e.g. "02 entries". */
  meta?: string;
}) {
  const { safe } = useMotionSafe();

  return (
    <header className="mb-12 md:mb-16">
      <motion.div
        aria-hidden
        className="h-px w-full origin-left bg-accent"
        initial={safe({ scaleX: 0 })}
        whileInView={safe({ scaleX: 1 })}
        viewport={{ once: true, amount: "some" }}
        transition={{ duration: 0.9, ease }}
      />

      <motion.div
        className="mt-4 flex items-baseline justify-between gap-6"
        initial={safe({ opacity: 0, y: 8 })}
        whileInView={safe({ opacity: 1, y: 0 })}
        viewport={{ once: true, amount: "some" }}
        transition={{ duration: 0.6, ease, delay: 0.15 }}
      >
        <h2 className="label text-foreground">
          <span className="text-accent">{String(index).padStart(2, "0")}</span>
          <span className="mx-2 text-muted">/</span>
          {children}
        </h2>

        {meta && <span className="label shrink-0 text-muted">{meta}</span>}
      </motion.div>
    </header>
  );
}
