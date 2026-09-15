"use client";

import { useRef, useState } from "react";
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
import { ProjectBadge } from "@/components/project-badge";
import { ProjectImage, hasProjectImage } from "@/components/project-image";
import { ProjectModal } from "@/components/project-modal";
import type { Project } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * Overview only — title, kind, year and stack. Everything long-form lives in
 * the modal, so the section stays scannable and the page stays short.
 */
export function Projects({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

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

      gsap.utils.toArray<HTMLElement>(".js-row").forEach((row) => {
        gsap.from(row, {
          opacity: 0,
          y: 40,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: row, start: "top 88%", once: true },
        });
      });
    },
    { scope: root, dependencies: [reduced] },
  );

  const open = (slug: string | null) => {
    setOpenSlug(slug);
    setIsOpen(true);
  };

  return (
    <section
      ref={root}
      id="work"
      className="relative mx-auto max-w-5xl scroll-mt-24 px-6 py-20 md:px-10 md:py-28"
    >
      <SectionHeading
        index={2}
        meta={`${String(projects.length).padStart(2, "0")} total`}
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

        <motion.ul className="md:pl-10" style={reduced ? undefined : { skewY }}>
          {projects.map((project, i) => (
            <ProjectRow
              key={project.slug}
              project={project}
              index={i}
              onOpen={() => open(project.slug)}
            />
          ))}
        </motion.ul>
      </div>

      <button
        type="button"
        onClick={() => open(null)}
        className="group label mt-10 inline-flex items-center gap-3 border border-border px-6 py-3.5 text-muted transition-colors hover:border-accent hover:text-accent md:ml-10"
      >
        View all projects
        <span
          aria-hidden
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          →
        </span>
      </button>

      <ProjectModal
        projects={projects}
        open={isOpen}
        focused={openSlug}
        onClose={() => setIsOpen(false)}
      />
    </section>
  );
}

function ProjectRow({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const reduced = useReducedMotion();

  // Pointer-tracked spotlight, so the row lights up under the cursor.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(20rem circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%)`;

  return (
    <li
      ref={ref}
      className="js-row group relative border-t border-border last:border-b"
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

      <button
        type="button"
        onClick={onOpen}
        aria-label={`${project.title} — view details`}
        className="w-full py-7 text-left outline-none focus-visible:bg-surface"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="label text-accent">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="text-2xl font-medium transition-colors duration-300 group-hover:text-accent md:text-3xl">
                {project.title}
              </h3>
              <ProjectBadge kind={project.kind} />
            </div>

            <p className="label mt-3 text-muted">
              {project.year}
              <span aria-hidden className="mx-2">
                ·
              </span>
              {project.role}
            </p>

            <p className="label mt-3 text-muted/70">
              {project.stack.join("  ·  ")}
            </p>
          </div>

          <div className="flex shrink-0 items-start gap-5">
            {hasProjectImage(project) && (
              <div className="hidden w-44 overflow-hidden border border-border sm:block">
                <ProjectImage
                  project={project}
                  width={640}
                  height={400}
                  sizes="11rem"
                  className="transition-transform duration-500 group-hover:scale-[1.04]"
                />
              </div>
            )}

            <span
              aria-hidden
              className="mt-1 text-muted transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent"
            >
              →
            </span>
          </div>
        </div>
      </button>
    </li>
  );
}
