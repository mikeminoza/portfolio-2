import { cn } from "@/lib/utils";

type ActionVariant = "solid" | "outline";

const VARIANTS: Record<ActionVariant, string> = {
  solid: "bg-foreground text-background",
  outline:
    "border border-border text-muted transition-colors hover:border-accent hover:text-accent",
};

type CommonProps = {
  children: React.ReactNode;
  variant?: ActionVariant;
  /** Trailing glyph that nudges on hover. */
  arrow?: "right" | "up-right" | "none";
  className?: string;
};

type ActionLinkProps = CommonProps & {
  href: string;
  external?: boolean;
};

type ActionButtonProps = CommonProps & {
  onClick: () => void;
  type?: "button" | "submit";
  "aria-expanded"?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
};

const BASE = "group label inline-flex items-center gap-3 px-6 py-3.5";

function Arrow({ kind }: { kind: Exclude<CommonProps["arrow"], "none"> }) {
  return (
    <span
      aria-hidden
      className={cn(
        "transition-transform duration-300",
        kind === "right"
          ? "group-hover:translate-x-1"
          : "group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
      )}
    >
      {kind === "right" ? "→" : "↗"}
    </span>
  );
}

/** Primary call to action rendered as a link. */
export function ActionLink({
  children,
  href,
  external = false,
  variant = "outline",
  arrow = "none",
  className,
}: ActionLinkProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className={cn(BASE, VARIANTS[variant], className)}
    >
      {children}
      {arrow !== "none" && <Arrow kind={arrow} />}
    </a>
  );
}

/** Same shape as {@link ActionLink}, for in-page actions. */
export function ActionButton({
  children,
  onClick,
  type = "button",
  variant = "outline",
  arrow = "none",
  className,
  disabled,
  ...aria
}: ActionButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(BASE, VARIANTS[variant], "disabled:opacity-40", className)}
      {...aria}
    >
      {children}
      {arrow !== "none" && <Arrow kind={arrow} />}
    </button>
  );
}
