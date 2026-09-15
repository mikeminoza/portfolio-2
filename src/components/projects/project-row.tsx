"use client";

import { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
} from "motion/react";
import { ProjectBadge } from "@/components/projects/project-badge";
import {
  ProjectImage,
  hasProjectImage,
} from "@/components/projects/project-image";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import type { Project } from "@/lib/content";

export type ProjectRowProps = {
  project: Project;
  index: number;
  onOpen: () => void;
};

/**
 * One line of the overview.
 *
 * The reveal is choreographed from the section (see `projects-section.tsx`).
 * The `js-` classes are the handles GSAP targets — they carry no styling, so
 * the row can be restyled without touching the animation.
 */
export function ProjectRow({ project, index, onOpen }: ProjectRowProps) {
  const ref = useRef<HTMLLIElement>(null);
  const { reduced } = useMotionSafe();

  // Pointer-tracked spotlight, so the row lights up under the cursor.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlight = useMotionTemplate`radial-gradient(20rem circle at ${mouseX}px ${mouseY}px, color-mix(in srgb, var(--accent) 7%, transparent), transparent 70%)`;

  // The thumbnail drifts against the scroll, so the image reads as sitting
  // behind its frame rather than pasted onto it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  return (
    <li
      ref={ref}
      className="js-row group relative last:border-b last:border-border"
      onPointerMove={(event) => {
        if (reduced || event.pointerType !== "mouse") return;
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(event.clientX - rect.left);
        mouseY.set(event.clientY - rect.top);
      }}
    >
      {/* Separator as an element rather than a border, so it can draw itself. */}
      <span
        aria-hidden
        className="js-row-rule absolute inset-x-0 top-0 h-px origin-left bg-border"
      />

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
        className="js-row-body w-full py-7 text-left outline-none focus-visible:bg-surface"
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
              <div className="js-row-media hidden w-44 overflow-hidden border border-border sm:block">
                <motion.div style={reduced ? undefined : { y: imageY }}>
                  <ProjectImage
                    project={project}
                    width={640}
                    height={400}
                    sizes="11rem"
                    className="transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </motion.div>
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
