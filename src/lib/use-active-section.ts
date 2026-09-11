"use client";

import { useEffect, useState } from "react";

/**
 * Tracks which section is currently under the reader.
 *
 * Picks the entry closest to the top of the viewport rather than the first
 * one intersecting, so passing through a short section doesn't leave the nav
 * pointing at the previous one.
 */
export function useActiveSection(ids: string[]) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);

    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort(
            (a, b) =>
              Math.abs(a.boundingClientRect.top) -
              Math.abs(b.boundingClientRect.top),
          );

        if (visible[0]) setActive(visible[0].target.id);
      },
      // Band across the upper-middle of the viewport: a section counts as
      // active once its top reaches roughly a third of the way down.
      { rootMargin: "-25% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
