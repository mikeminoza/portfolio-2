import { cn } from "@/lib/utils";

/**
 * Underlined link with a trailing glyph that lifts on hover — used for
 * project Live/Code links and the contact address.
 *
 * The scoped `group/link` name matters: these sit inside rows that already
 * own a bare `group`, and an unnamed nested group would steal those hovers.
 */
export function InlineLink({
  children,
  href,
  arrow = "up-right",
  size = "label",
  className,
}: {
  children: React.ReactNode;
  href: string;
  arrow?: "right" | "up-right";
  /** `label` is the monospace micro-type; `lg` is for the contact address. */
  size?: "label" | "lg";
  className?: string;
}) {
  const external = href.startsWith("http");

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn(
        "group/link inline-flex items-center gap-2 border-b border-border pb-1 text-muted transition-colors hover:border-accent hover:text-accent",
        size === "label" ? "label" : "text-lg md:text-2xl",
        className,
      )}
    >
      {children}
      <span
        aria-hidden
        className={cn(
          "transition-transform duration-300",
          arrow === "right"
            ? "group-hover/link:translate-x-1"
            : "group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5",
        )}
      >
        {arrow === "right" ? "→" : "↗"}
      </span>
    </a>
  );
}
