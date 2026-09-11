"use client";

import { useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useReducedMotion,
} from "motion/react";

/**
 * Pulls its child toward the cursor while hovered, then springs back.
 *
 * Pointer-driven rather than autonomous, and the displacement is capped at a
 * few pixels — enough to feel responsive, not enough to make the target move
 * away from someone trying to click it.
 */
export function Magnetic({
  children,
  strength = 0.35,
  radius = 14,
  className,
}: {
  children: React.ReactNode;
  /** Fraction of the cursor offset the element follows. */
  strength?: number;
  /** Maximum displacement in px. */
  radius?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  const x = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });
  const y = useSpring(useMotionValue(0), { stiffness: 260, damping: 22 });

  if (reduced) return <div className={className}>{children}</div>;

  const clamp = (value: number) => Math.max(-radius, Math.min(radius, value));

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ x, y }}
      onPointerMove={(event) => {
        // Coarse pointers have no hover state to speak of; leave them alone.
        if (event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        x.set(clamp((event.clientX - (rect.left + rect.width / 2)) * strength));
        y.set(clamp((event.clientY - (rect.top + rect.height / 2)) * strength));
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
