"use client";

import { useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useScroll,
  useSpring,
  useTransform,
  useVelocity,
  useReducedMotion,
} from "motion/react";
import { SectionHeading } from "@/components/section-heading";
import { urlFor } from "@/sanity/client";
import type { Project } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * GSAP-driven section. Motion handles the simple entrances elsewhere; this
 * one uses ScrollTrigger because the rows and the progress rail need to be
 * choreographed against a single scroll range.
 */
export function Projects({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Scroll velocity leans the list very slightly, which reads as weight.
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 50, stiffness: 320 });
  const skewY = useTransform(smoothVelocity, [-2500, 0, 2500], [2.2, 0, -2.2], {
    clamp: true,
  });

  useGSAP(
    () => {
      if (reduced) return;

      // The rail draws down as the section scrolls through.
      gsap.fromTo(
        ".js-rail",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top 65%",
            end: "bottom 75%",
            scrub: 0.4,
          },
        },
      );

      // Each row rises as it enters.
      gsap.utils.toArray<HTMLElement>(".js-row").forEach((row) => {
        gsap.from(row, {
          opacity: 0,
          y: 48,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 85%", once: true },
        });
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  return (
    <section
      ref={root}
      id="work"
      className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-28 md:px-10 md:py-40"
    >
      <SectionHeading count={projects.length}>Selected work</SectionHeading>

      <div className="relative">
        {/* progress rail */}
        <div
          aria-hidden
          className="absolute left-0 top-0 hidden h-full w-px bg-border md:block"
        >
          <div className="js-rail h-full w-px origin-top bg-accent" />
        </div>

        <motion.ol
          className="md:pl-10"
          style={reduced ? undefined : { skewY }}
        >
          {projects.map((project, i) => (
            <ProjectRow key={project.slug} project={project} index={i} />
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

function ProjectRow({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();

  // Pointer-tracked spotlight, so the row lights up under the cursor.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(22rem circle at ${mouseX}px ${mouseY}px, color-mix(in oklch, var(--accent) 10%, transparent), transparent 70%)`;

  return (
    <li
      ref={ref}
      className="js-row group relative border-b border-border py-10 first:pt-0 last:border-0"
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(event.clientX - rect.left);
        mouseY.set(event.clientY - rect.top);
      }}
    >
      {!reduced && (
        <motion.div
          aria-hidden
          style={{ background: spotlight }}
          className="pointer-events-none absolute -inset-x-6 inset-y-0 -z-10 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      <article className="grid gap-6 md:grid-cols-[1fr_auto] md:items-start">
        <div>
          <div className="mb-3 flex items-center gap-3 font-mono text-xs text-muted">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span className="h-px w-6 bg-border" />
            <span>{project.year}</span>
            <span className="h-px w-6 bg-border" />
            <span>{project.role}</span>
          </div>

          <h3 className="text-2xl font-medium tracking-tight transition-colors group-hover:text-accent md:text-3xl">
            {project.title}
          </h3>

          <p className="mt-3 max-w-xl text-pretty leading-relaxed text-muted">
            {project.summary}
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {project.stack.map((tech) => (
              <li
                key={tech}
                className="rounded-full border border-border px-3 py-1 font-mono text-[11px] text-muted transition-colors group-hover:border-accent/40"
              >
                {tech}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-4 md:items-end">
          {project.cover && (
            <div className="w-full overflow-hidden rounded-lg border border-border md:w-56">
              <Image
                src={urlFor(project.cover).width(640).height(400).url()}
                alt={project.cover.alt ?? project.title}
                width={640}
                height={400}
                sizes="(min-width: 768px) 14rem, 100vw"
                className="h-auto w-full transition-transform duration-500 group-hover:scale-[1.04]"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
            {project.demo && (
              <ProjectLink href={project.demo}>Live</ProjectLink>
            )}
            {project.repo && <ProjectLink href={project.repo}>Code</ProjectLink>}
          </div>
        </div>
      </article>
    </li>
  );
}

function ProjectLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group/link inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      {children}
      <span
        aria-hidden
        className="transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5"
      >
        ↗
      </span>
    </a>
  );
}
