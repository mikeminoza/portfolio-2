"use client";

import { useState } from "react";
import {
  motion,
  useScroll,
  useMotionValueEvent,
  useReducedMotion,
} from "motion/react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useActiveSection } from "@/lib/use-active-section";
import { cn } from "@/lib/utils";

const links = [
  { label: "Experience", id: "experience" },
  { label: "Work", id: "work" },
  { label: "Skills", id: "skills" },
  { label: "Contact", id: "contact" },
];

const ids = links.map((link) => link.id);

export function SiteHeader({ name }: { name: string }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(ids);
  const reduced = useReducedMotion();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  // First name only — the full name is the hero's job, not the nav's.
  const short = name.split(" ")[0]?.toLowerCase() ?? name.toLowerCase();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled && "border-b border-border bg-background/72 backdrop-blur-lg",
      )}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        <a href="#" className="font-mono text-sm font-medium tracking-tight">
          {short}
        </a>

        <div className="flex items-center gap-2 md:gap-3">
          <ul className="hidden items-center sm:flex">
            {links.map((link) => {
              const isActive = active === link.id;

              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "relative block px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "text-foreground"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {/* Shared layout pill slides between links as you scroll. */}
                    {isActive && (
                      <motion.span
                        layoutId={reduced ? undefined : "nav-pill"}
                        className="absolute inset-0 -z-10 rounded-full bg-surface"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
                    {link.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </motion.header>
  );
}
