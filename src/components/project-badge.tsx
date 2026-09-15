import { cn } from "@/lib/utils";
import type { ProjectKind } from "@/lib/content";

const LABELS: Record<ProjectKind, string> = {
  professional: "Professional",
  personal: "Personal",
};

/**
 * Marks whether a project shipped for an employer or was built on his own
 * time. Professional work carries the accent; personal work stays neutral,
 * so the eye lands on the paid work first without the page shouting.
 */
export function ProjectBadge({
  kind,
  className,
}: {
  kind: ProjectKind;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "label shrink-0 whitespace-nowrap border px-2 py-0.5",
        kind === "professional"
          ? "border-accent text-accent"
          : "border-border text-muted",
        className,
      )}
    >
      {LABELS[kind]}
    </span>
  );
}
