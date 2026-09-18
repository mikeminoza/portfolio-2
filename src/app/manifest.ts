import type { MetadataRoute } from "next";
import { getProfile } from "@/lib/content";
import { brand } from "@/lib/site";

/**
 * Installable-app metadata. Not a ranking signal, but it is what Android and
 * Chrome read for the name, icon and splash colours when the site is saved to
 * a home screen — and it is one of the things Lighthouse's SEO and PWA audits
 * look for.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const profile = await getProfile();

  return {
    name: `${profile.name} — ${profile.title}`,
    short_name: profile.name,
    description: profile.intro[0] ?? "",
    start_url: "/",
    display: "standalone",
    background_color: brand.background,
    theme_color: brand.background,
    icons: [
      { src: "/icon.svg", type: "image/svg+xml", sizes: "any" },
      { src: "/apple-icon", type: "image/png", sizes: "180x180" },
    ],
  };
}
