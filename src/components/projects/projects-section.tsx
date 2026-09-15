"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { SectionHeading } from "@/components/layout/section-heading";
import { ProjectModal } from "@/components/projects/project-modal";
import { ProjectRow } from "@/components/projects/project-row";
import { ActionButton } from "@/components/ui/action";
import { useMotionSafe } from "@/hooks/use-motion-safe";
import type { Project } from "@/lib/content";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** How far scroll velocity is allowed to lean the list, in degrees. */
const MAX_SKEW = 1.6;

/**
 * Overview only — title, kind, year and stack. Everything long-form lives in
 * the modal, so the section stays scannable and the page stays short.
 */
export function ProjectsSection({ projects }: { projects: Project[] }) {
  const root = useRef<HTMLElement>(null);
  const { reduced, safe } = useMotionSafe();

  const [focusedSlug, setFocusedSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Scroll velocity leans the list very slightly, which reads as weight.
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(velocity, { damping: 50, stiffness: 320 });
  const skewY = useTransform(
    smoothVelocity,
    [-2500, 0, 2500],
    [MAX_SKEW, 0, -MAX_SKEW],
    { clamp: true },
  );

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

  const openModal = (slug: string | null) => {
    setFocusedSlug(slug);
    setIsModalOpen(true);
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

        <motion.ul className="md:pl-10" style={safe({ skewY })}>
          {projects.map((project, index) => (
            <ProjectRow
              key={project.slug}
              project={project}
              index={index}
              onOpen={() => openModal(project.slug)}
            />
          ))}
        </motion.ul>
      </div>

      <ActionButton
        onClick={() => openModal(null)}
        arrow="right"
        className="mt-10 md:ml-10"
      >
        View all projects
      </ActionButton>

      <ProjectModal
        projects={projects}
        open={isModalOpen}
        focused={focusedSlug}
        onClose={() => setIsModalOpen(false)}
      />
    </section>
  );
}
