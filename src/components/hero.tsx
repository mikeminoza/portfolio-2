"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { SplitText } from "@/components/split-text";
import { Magnetic } from "@/components/magnetic";
import type { Profile } from "@/lib/content";

export function Hero({ profile }: { profile: Profile }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Scroll-linked parallax: the hero drifts up and dims as you leave it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "28%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const style = reduced ? undefined : { y, opacity };

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92svh] items-center overflow-hidden px-6 pb-28 pt-28 md:px-10 md:pt-32"
    >
      <Backdrop />

      <motion.div style={style} className="relative mx-auto w-full max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs uppercase tracking-[0.2em] text-muted"
        >
          <span>{profile.title}</span>
          <span aria-hidden className="h-px w-6 bg-border" />
          <span>{profile.location}</span>
        </motion.p>

        <h1 className="max-w-4xl text-balance text-4xl font-semibold leading-[1.06] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
          <SplitText text={profile.name} delay={0.2} />
          <br />
          <span className="text-muted">
            <SplitText text="builds the backend." delay={0.55} />
          </span>
        </h1>

        <div className="mt-8 max-w-xl space-y-4">
          {profile.intro.map((paragraph, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.95 + i * 0.1 }}
              className="text-pretty text-base leading-relaxed text-muted md:text-lg"
            >
              {paragraph}
            </motion.p>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="mt-10 flex flex-wrap items-center gap-3"
        >
          <Magnetic>
            <a
              href="#work"
              className="group inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background"
            >
              See the work
              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </a>
          </Magnetic>
          <Magnetic>
            <a
              href={`mailto:${profile.email}`}
              className="inline-block rounded-full border border-border px-5 py-2.5 text-sm font-medium text-muted transition-colors hover:border-accent hover:text-foreground"
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

/** Soft animated gradient. Pure opacity/transform, so it stays cheap. */
function Backdrop() {
  const reduced = useReducedMotion();

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <motion.div
        className="absolute left-1/2 top-[-10%] size-[42rem] -translate-x-1/2 rounded-full blur-[120px]"
        style={{ background: "color-mix(in oklch, var(--accent) 22%, transparent)" }}
        animate={reduced ? undefined : { scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,var(--background)_78%)]" />
    </div>
  );
}

function ScrollHint() {
  const reduced = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.5, duration: 0.8 }}
      className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 sm:block"
      aria-hidden
    >
      <motion.div
        animate={reduced ? undefined : { y: [0, 7, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        className="h-9 w-5 rounded-full border border-border p-1"
      >
        <div className="mx-auto h-1.5 w-0.5 rounded-full bg-muted" />
      </motion.div>
    </motion.div>
  );
}
