"use client";

import { useCallback, useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useLenis } from "lenis/react";
import { ProjectBadge } from "@/components/project-badge";
import { ProjectImage, hasProjectImage } from "@/components/project-image";
import type { Project } from "@/lib/content";

const FOCUSABLE =
  'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])';

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
}: {
  projects: Project[];
  open: boolean;
  /** Slug to scroll to when opening from a specific row. */
  focused?: string | null;
  onClose: () => void;
}) {
  const reduced = useReducedMotion();
  const lenis = useLenis();
  const panelRef = useRef<HTMLDivElement>(null);
  const entryRefs = useRef(new Map<string, HTMLLIElement>());

  /*
   * Lenis drives the page scroll, so `overflow: hidden` alone does not hold it
   * — it has to be stopped explicitly. Under reduced motion Lenis is never
   * mounted, so the overflow lock is the real one; both run either way.
   */
  useEffect(() => {
    if (!open) return;

    lenis?.stop();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      lenis?.start();
      document.body.style.overflow = previous;
    };
  }, [open, lenis]);

  // Escape closes; Tab stays inside the panel.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;

      const nodes = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!nodes?.length) return;

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Move focus into the panel, and jump to the row that was clicked.
  useEffect(() => {
    if (!open) return;

    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    if (focused) {
      entryRefs.current
        .get(focused)
        ?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
    }
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
          className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6"
        >
          <motion.div
            aria-hidden
            onClick={onClose}
            initial={reduced ? undefined : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label="All projects"
            initial={reduced ? undefined : { opacity: 0, y: 24 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: 24 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
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
                className="label grid size-8 shrink-0 place-items-center border border-border text-muted transition-colors hover:border-accent hover:text-accent"
              >
                <span aria-hidden className="text-base leading-none">
                  &times;
                </span>
              </button>
            </header>

            {/*
              Lenis cancels wheel events at the root, so a nested scroll
              container gets no native scrolling even while Lenis is stopped.
              `data-lenis-prevent` tells it to leave events from this subtree
              alone — without it this list simply will not scroll.
            */}
            <ol
              data-lenis-prevent
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 md:px-8"
            >
              {projects.map((project, i) => (
                <li
                  key={project.slug}
                  ref={registerEntry(project.slug)}
                  className="scroll-mt-4 border-b border-border py-8 last:border-0"
                >
                  <div className="label flex flex-wrap items-center gap-3 text-muted">
                    <span className="text-accent">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span aria-hidden className="h-px w-5 bg-border" />
                    <span>{project.year}</span>
                    <span aria-hidden>·</span>
                    <span>{project.role}</span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-medium md:text-3xl">
                      {project.title}
                    </h3>
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
                      <li
                        key={tech}
                        className="border border-border px-2.5 py-1 font-mono text-xs text-muted"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>

                  {(project.demo || project.repo) && (
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      {project.demo && (
                        <ModalLink href={project.demo}>Live</ModalLink>
                      )}
                      {project.repo && (
                        <ModalLink href={project.repo}>Code</ModalLink>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function ModalLink({
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
