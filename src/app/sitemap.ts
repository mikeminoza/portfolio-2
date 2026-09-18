import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * One page, one entry.
 *
 * The sections and project detail views are anchors and modals on the home
 * route, not addressable URLs — listing fragments here would be invalid, and
 * the Studio is deliberately excluded.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
