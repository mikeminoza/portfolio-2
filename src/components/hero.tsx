"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { SplitText } from "@/components/split-text";
import { Magnetic } from "@/components/magnetic";
import { ease } from "@/lib/motion";
import type { Profile } from "@/lib/content";

export function Hero({ profile }: { profile: Profile }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Scroll-linked parallax: the hero drifts up and dims as you leave it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const style = reduced ? undefined : { y, opacity };

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92svh] items-center overflow-hidden px-6 pb-24 pt-28 md:px-10 md:pt-32"
    >
      <Backdrop />

      <motion.div style={style} className="relative mx-auto w-full max-w-5xl">
        <motion.div
          initial={reduced ? undefined : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <div className="h-px w-full bg-border" />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
            <p className="label text-muted">
              <span className="text-accent">00</span>
              <span className="mx-2">/</span>
              {profile.title}
            </p>
            <p className="label text-muted">{profile.location}</p>
          </div>
        </motion.div>

        <h1 className="mt-10 max-w-4xl text-balance text-[clamp(2.5rem,8vw,6rem)] font-semibold leading-[0.98]">
          <SplitText text={profile.name} delay={0.25} />
          <br />
          <span className="text-muted">
            <SplitText text="builds end to end." delay={0.6} />
          </span>
        </h1>

        <div className="mt-10 max-w-xl space-y-4 border-l border-border pl-6">
          {profile.intro.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={reduced ? undefined : { opacity: 0, y: 12 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease, delay: 1 + i * 0.1 }}
              className="text-pretty leading-relaxed text-muted md:text-lg"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={reduced ? undefined : { opacity: 0, y: 12 }}
          animate={reduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease, delay: 1.25 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <a
              href="#work"
              className="group label inline-flex items-center gap-3 bg-foreground px-6 py-3.5 text-background"
            >
              See the work
              <span
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href={`mailto:${profile.email}`}
              className="label inline-block border border-border px-6 py-3.5 text-muted transition-colors hover:border-accent hover:text-accent"
            >
              Get in touch
            </a>
          </Magnetic>
        </motion.div>
      </motion.div>

      <ScrollHint />
    </section>
  );
}

/**
 * Faint engineering grid, masked to a soft pool in the centre. Replaces the
 * usual blurred colour blob — the grid reads as drafting paper rather than
 * as a marketing gradient.
 */
function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="grid-paper absolute inset-0 opacity-[0.55] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,#000,transparent)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-border" />
    </div>
  );
}

function ScrollHint() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.6, duration: 0.8 }}
      className="absolute bottom-8 left-6 hidden items-center gap-3 sm:flex md:left-10"
      aria-hidden
    >
      <span className="label text-muted">Scroll</span>
      <motion.span
        className="block h-px w-12 bg-muted"
        animate={reduced ? undefined : { scaleX: [1, 0.35, 1] }}
        style={{ transformOrigin: "left" }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}
