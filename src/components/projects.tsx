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
  const skewY = useTransform(smoothVelocity, [-2500, 0, 2500], [1.6, 0, -1.6], {
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
          y: 40,
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
      className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading
        index={2}
        meta={`${String(projects.length).padStart(2, "0")} selected`}
      >
        Work
      </SectionHeading>

      <div className="relative">
        <div
          aria-hidden
          className="absolute left-0 top-0 hidden h-full w-px bg-border md:block"
        >
          <div className="js-rail h-full w-px origin-top bg-accent" />
        </div>

        <motion.ol className="md:pl-10" style={reduced ? undefined : { skewY }}>
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
  const spotlight = useMotionTemplate`radial-gradient(20rem circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%)`;

  return (
    <li
      ref={ref}
      className="js-row group relative border-t border-border py-10 last:border-b"
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
          className="pointer-events-none absolute -inset-x-6 inset-y-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
      )}

      <article className="grid gap-x-10 gap-y-6 md:grid-cols-[1fr_14rem] md:items-start">
        <div>
          <div className="label flex items-center gap-3 text-muted">
            <span className="text-accent">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span aria-hidden className="h-px w-5 bg-border" />
            <span>{project.year}</span>
            <span aria-hidden>·</span>
            <span>{project.role}</span>
          </div>

          <h3 className="mt-4 text-3xl font-medium transition-colors duration-300 group-hover:text-accent md:text-4xl">
            {project.title}
          </h3>

          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-muted">
            {project.summary}
          </p>

          <p className="label mt-6 text-muted/70">
            {project.stack.join("  ·  ")}
          </p>
        </div>

        <div className="flex flex-col items-start gap-5 md:items-end">
          {project.cover && (
            <div className="w-full overflow-hidden border border-border">
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

          <div className="flex items-center gap-5">
            {project.demo && <ProjectLink href={project.demo}>Live</ProjectLink>}
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
      className="label group/link inline-flex items-center gap-1.5 border-b border-border pb-1 text-muted transition-colors hover:border-accent hover:text-accent"
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
