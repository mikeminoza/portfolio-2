"use client";

import { useCallback } from "react";
import { useReducedMotion } from "motion/react";

/**
 * Wraps the reduced-motion check so components stop repeating
 * `reduced ? undefined : {...}` on every animated prop.
 *
 * `safe(props)` returns the props normally, or `undefined` when the visitor
 * has asked for reduced motion — which is what Motion expects in order to
 * skip the animation entirely rather than run it at zero duration.
 */
export function useMotionSafe() {
  const reduced = useReducedMotion() ?? false;

  const safe = useCallback(
    <T,>(props: T): T | undefined => (reduced ? undefined : props),
    [reduced],
  );

  return { reduced, safe };
}
