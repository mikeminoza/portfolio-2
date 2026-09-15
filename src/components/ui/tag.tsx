import { cn } from "@/lib/utils";

type TagSize = "sm" | "md";
type TagTone = "muted" | "accent";
/**
 * `mono` is plain monospace — stack items, skills, suggestions.
 * `label` adds uppercase and wide tracking, for chips that read as status
 * rather than as content (the project kind, an honour).
 */
type TagTreatment = "mono" | "label";

const SIZES: Record<TagSize, string> = {
  sm: "px-2 py-0.5 text-[11px]",
  md: "px-2.5 py-1 text-xs",
};

const TONES: Record<TagTone, string> = {
  muted: "border-border text-muted",
  accent: "border-accent text-accent",
};

export type TagProps = {
  children: React.ReactNode;
  size?: TagSize;
  tone?: TagTone;
  treatment?: TagTreatment;
  /** Adds hover affordance. Set it when the tag is inside a button or link. */
  interactive?: boolean;
  className?: string;
};

/**
 * Square, hairline-bordered chip — the one used for stack items, skills and
 * suggestions. Previously hand-rolled in six places with slightly different
 * padding each time.
 */
export function Tag({
  children,
  size = "md",
  tone = "muted",
  treatment = "mono",
  interactive = false,
  className,
}: TagProps) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap border",
        treatment === "label" ? "label" : "font-mono",
        // `label` sets its own size and tracking; don't fight it.
        treatment === "mono" && SIZES[size],
        treatment === "label" && (size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1"),
        TONES[tone],
        interactive && "transition-colors hover:border-accent hover:text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
