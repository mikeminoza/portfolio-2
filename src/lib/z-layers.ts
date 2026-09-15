/**
 * Stacking order, in one place.
 *
 * These were previously scattered as bare `z-[70]`-style literals across
 * components, which made it impossible to tell what sat above what without
 * grepping. Order here is the order on screen, bottom to top.
 *
 * The values are written as literal Tailwind classes so the scanner still
 * sees them.
 */
export const Z = {
  /** Sticky section furniture, gradients, spotlights. */
  raised: "z-10",
  /** Fixed site header. */
  header: "z-40",
  /** Reading-progress rail — above the header's backdrop blur. */
  progress: "z-50",
  /** Floating assistant launcher and panel. */
  assistant: "z-60",
  /** Modal dialogs, above everything else. */
  dialog: "z-70",
} as const;
