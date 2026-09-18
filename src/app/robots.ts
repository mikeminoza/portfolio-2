import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * The Studio already ships `robots: noindex` via `next-sanity`, but that only
 * stops indexing after a crawl. Disallowing it here — along with the API
 * routes, which return JSON nobody should land on from a search result —
 * keeps crawlers out of them in the first place.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/studio", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
