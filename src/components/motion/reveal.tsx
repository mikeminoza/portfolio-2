"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { riseIn, stagger } from "@/lib/motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
  delay?: number;
  variants?: Variants;
  as?: "div" | "section" | "li" | "article" | "header" | "footer";
};

/**
 * Scroll-triggered entrance. Animates once, and collapses to a plain
 * element when the user prefers reduced motion.
 */
export function Reveal({
  children,
  className,
  amount = 0.25,
  delay = 0,
  variants = riseIn,
  as = "div",
}: RevealProps) {
  const reduced = useReducedMotion();
  const Tag = motion[as];

  if (reduced) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={variants}
      transition={{ delay }}
    >
      {children}
    </Tag>
  );
}

/** Wraps a group so children reveal in sequence. Pair with <Reveal /> items. */
export function RevealGroup({
  children,
  className,
  gap = 0.08,
  delay = 0,
  amount = 0.2,
}: {
  children: React.ReactNode;
  className?: string;
  gap?: number;
  delay?: number;
  amount?: number;
}) {
  const reduced = useReducedMotion();

  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
      variants={stagger(gap, delay)}
    >
      {children}
    </motion.div>
  );
}
