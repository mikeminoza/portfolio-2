"use client";

import { motion, useScroll, useSpring } from "motion/react";

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
      className="fixed inset-x-0 top-0 z-[60] h-px origin-left bg-accent"
    />
  );
}
