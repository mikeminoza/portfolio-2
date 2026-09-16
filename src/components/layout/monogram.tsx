import { cn } from "@/lib/utils";

/**
 * MAM monogram.
 *
 * Drawn as strokes on a fixed grid rather than set in a typeface, so it
 * matches the hairline rules and square joins the rest of the page is built
 * from. Letters are constructed, not lettered: the M is four segments, the A
 * is two plus a crossbar.
 *
 * Butt caps and miter joins are deliberate — round caps would soften the
 * terminals and read as a different design language. Strokes inherit
 * `currentColor` so the mark follows the theme; only the A's crossbar takes
 * the accent, keeping to the single-signal-colour rule used elsewhere.
 */
export function Monogram({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 96 26"
      role="img"
      aria-label="MAM"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      className={cn("h-4 w-auto", className)}
    >
      {/* M */}
      <path d="M1.25 25V1l10.75 13L22.75 1v24" />

      {/* A */}
      <path d="M36.25 25 47 1l10.75 24" />
      <path d="M41.2 16h11.6" stroke="var(--accent)" />

      {/* M */}
      <path d="M71.25 25V1L82 14 92.75 1v24" />
    </svg>
  );
}
