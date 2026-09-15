import Image from "next/image";
import { urlFor } from "@/sanity/client";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/content";

/** Whether this project has any artwork to show. */
export function hasProjectImage(project: Project) {
  return Boolean(project.cover || project.staticCover);
}

/**
 * A project's picture, from whichever source exists.
 *
 * Sanity wins when a cover is set — it gives hotspot-aware crops through the
 * CDN. Otherwise the checked-in screenshot in `/public/projects` is used, so
 * the site still shows artwork before the CMS is connected.
 *
 * Renders nothing when neither exists, rather than a broken frame.
 */
export function ProjectImage({
  project,
  width,
  height,
  sizes,
  className,
  priority = false,
}: {
  project: Project;
  width: number;
  height: number;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const source = project.cover
    ? {
        src: urlFor(project.cover).width(width).height(height).url(),
        alt: project.cover.alt ?? `${project.title} screenshot`,
      }
    : project.staticCover
      ? { src: project.staticCover.src, alt: project.staticCover.alt }
      : null;

  if (!source) return null;

  return (
    <Image
      src={source.src}
      alt={source.alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      className={cn("h-auto w-full object-cover", className)}
    />
  );
}
