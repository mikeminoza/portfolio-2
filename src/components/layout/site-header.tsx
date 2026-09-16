"use client";

import { useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "motion/react";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import { Monogram } from "@/components/layout/monogram";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useActiveSection } from "@/hooks/use-active-section";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-layers";

const links = [
  { label: "Experience", id: "experience" },
  { label: "Work", id: "work" },
  { label: "Stack", id: "skills" },
  { label: "Contact", id: "contact" },
];

const ids = links.map((link) => link.id);

export function SiteHeader({ name }: { name: string }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(ids);
  const { safe } = useMotionSafe();

  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 24));

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className={cn(
        "fixed inset-x-0 top-0 transition-all duration-300",
        Z.header,
        scrolled && "border-b border-border bg-background/80 backdrop-blur-md",
      )}
    >
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4 md:px-10">
        <a
          href="#"
          aria-label={`${name} — back to top`}
          className="text-foreground transition-colors hover:text-accent"
        >
          <Monogram />
        </a>

        <div className="flex items-center gap-4 md:gap-6">
          <ul className="hidden items-center gap-5 sm:flex md:gap-7">
            {links.map((link) => {
              const isActive = active === link.id;

              return (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    aria-current={isActive ? "true" : undefined}
                    className={cn(
                      "label relative block py-1 transition-colors",
                      isActive
                        ? "text-accent"
                        : "text-muted hover:text-foreground",
                    )}
                  >
                    {link.label}
                    {/* Marker slides between links rather than a pill sliding
                        behind them — an underline suits the rules elsewhere. */}
                    {isActive && (
                      <motion.span
                        layoutId={safe("nav-marker")}
                        className="absolute -bottom-0.5 left-0 h-px w-full bg-accent"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 32,
                        }}
                      />
                    )}
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
