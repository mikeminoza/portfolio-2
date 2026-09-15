"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { Z } from "@/lib/z-layers";
import { cn } from "@/lib/utils";

/**
 * Reading-progress rail pinned to the top of the viewport.
 *
 * Scroll-linked rather than autonomous, so it stays on under reduced motion —
 * it reports position, it doesn't decorate. The spring only takes the jitter
 * off the raw scroll value.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 220,
    damping: 40,
    restDelta: 0.001,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className={cn("fixed inset-x-0 top-0 h-px origin-left bg-accent", Z.progress)}
    />
  );
}
