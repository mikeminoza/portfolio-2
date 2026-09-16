"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ProjectBadge } from "@/components/projects/project-badge";
import {
  ProjectImage,
  hasProjectImage,
} from "@/components/projects/project-image";
import { InlineLink } from "@/components/ui/inline-link";
import { Tag } from "@/components/ui/tag";
import { useEscapeKey } from "@/hooks/use-escape-key";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Z } from "@/lib/z-layers";
import type { Project } from "@/lib/content";

export type ProjectModalProps = {
  projects: Project[];
  open: boolean;
  /** Slug to scroll to when opening from a specific row. */
  focused?: string | null;
  onClose: () => void;
};

/**
 * Full detail for every project.
 *
 * The page itself carries only an overview; everything long-form — the full
 * summary, cover art and links — lives here so the section stays scannable.
 */
export function ProjectModal({
  projects,
  open,
  focused,
  onClose,
}: ProjectModalProps) {
  const { reduced, safe } = useMotionSafe();
  const panelRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef(new Map<string, HTMLLIElement>());

  useScrollLock(open);
  useEscapeKey(open, onClose);
  useFocusTrap(open, panelRef);

  // Jump to the row that was clicked, once the panel exists.
  useEffect(() => {
    if (!open || !focused) return;
    entryRefs.current.get(focused)?.scrollIntoView({
      block: "start",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [open, focused, reduced]);

  const registerEntry = useCallback(
    (slug: string) => (node: HTMLLIElement | null) => {
      if (node) entryRefs.current.set(slug, node);
      else entryRefs.current.delete(slug);
    },
    [],
  );

  return (
    <AnimatePresence>
      {open && (
        // Keyed so AnimatePresence tracks this subtree across renders; without
        // a key the exit transition on the children below is unreliable.
        <div
          key="project-modal"
          className={cn(
            "fixed inset-0 flex items-end justify-center p-0 sm:items-center sm:p-6",
            Z.dialog,
          )}
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={safe({ opacity: 0 })}
            animate={safe({ opacity: 1 })}
            exit={safe({ opacity: 0 })}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="All projects"
            initial={safe({ opacity: 0, y: 24 })}
            animate={safe({ opacity: 1, y: 0 })}
            exit={safe({ opacity: 0, y: 24 })}
            transition={{ duration: 0.28, ease }}
            className="relative flex max-h-[92svh] w-full max-w-3xl flex-col border border-border bg-background sm:max-h-[85svh]"
          >
            <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-5 py-4 md:px-8">
              <p className="label text-foreground">
                <span className="text-accent">02</span>
                <span className="mx-2 text-muted">/</span>
                All projects
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="grid size-8 shrink-0 place-items-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden className="text-base leading-none">
                  &times;
                </span>
              </button>
            </header>

            {/*
              Lenis cancels wheel events at the root, so a nested scroll
              container gets no native scrolling even while Lenis is stopped.
              `data-lenis-prevent` tells it to leave this subtree alone —
              without it this list simply will not scroll.
            */}
            <ol
              data-lenis-prevent
              className="scroll-slim min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-8"
            >
              {projects.map((project, index) => (
                <ProjectEntry
                  key={project.slug}
                  ref={registerEntry(project.slug)}
                  project={project}
                  index={index}
                />
              ))}
            </ol>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ProjectEntry({
  project,
  index,
  ref,
}: {
  project: Project;
  index: number;
  ref: (node: HTMLLIElement | null) => void;
}) {
  return (
    <li
      ref={ref}
      className="scroll-mt-4 border-b border-border py-8 last:border-0"
    >
      <div className="label flex flex-wrap items-center gap-3 text-muted">
        <span className="text-accent">{String(index + 1).padStart(2, "0")}</span>
        <span aria-hidden className="h-px w-5 bg-border" />
        <span>{project.year}</span>
        <span aria-hidden>·</span>
        <span>{project.role}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h3 className="text-2xl font-medium md:text-3xl">{project.title}</h3>
        <ProjectBadge kind={project.kind} />
      </div>

      {hasProjectImage(project) && (
        <div className="mt-5 overflow-hidden border border-border">
          <ProjectImage
            project={project}
            width={1440}
            height={900}
            sizes="(min-width: 768px) 42rem, 100vw"
          />
        </div>
      )}

      <p className="mt-4 max-w-2xl text-pretty leading-relaxed text-muted">
        {project.summary}
      </p>

      <ul className="mt-5 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li key={tech}>
            <Tag>{tech}</Tag>
          </li>
        ))}
      </ul>

      {(project.demo || project.repo) && (
        <div className="mt-6 flex flex-wrap items-center gap-5">
          {project.demo && <InlineLink href={project.demo}>Live</InlineLink>}
          {project.repo && <InlineLink href={project.repo}>Code</InlineLink>}
        </div>
      )}
    </li>
  );
}
