"use client";

import { useEffect } from "react";
import { useLenis } from "lenis/react";

/**
 * Holds the page still while an overlay is open.
 *
 * Two locks, both needed: Lenis drives the scroll itself and ignores
 * `overflow: hidden`, while under reduced motion Lenis is never mounted and
 * the overflow lock is the only one doing anything.
 *
 * Note that a nested scroll container still needs `data-lenis-prevent` —
 * Lenis cancels wheel events at the root even while stopped.
 */
export function useScrollLock(active: boolean) {
  const lenis = useLenis();

  useEffect(() => {
    if (!active) return;

    lenis?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      lenis?.start();
      document.body.style.overflow = previous;
    };
  }, [active, lenis]);
}
