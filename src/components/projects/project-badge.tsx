import { Tag } from "@/components/ui/tag";
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
export function ProjectBadge({ kind }: { kind: ProjectKind }) {
  return (
    <Tag
      size="sm"
      treatment="label"
      tone={kind === "professional" ? "accent" : "muted"}
    >
      {LABELS[kind]}
    </Tag>
  );
}
