/**
 * Everything that needs to know where the site actually lives.
 *
 * Canonical tags, the sitemap, robots.txt and OG image URLs all have to be
 * absolute, so the origin can't be inferred from the request — it has to be
 * configured. Resolution order:
 *
 *   1. `NEXT_PUBLIC_SITE_URL` — set this in production, it always wins.
 *   2. `VERCEL_PROJECT_PRODUCTION_URL` — Vercel injects the production domain,
 *      so a deploy there is correct with no configuration at all. Note this is
 *      the *production* domain even on preview deploys, which is what we want:
 *      previews should never advertise themselves as canonical.
 *   3. localhost, for development.
 *
 * Trailing slashes are stripped so composing `${siteUrl}/path` never doubles up.
 */
function resolveSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  if (configured) return configured.replace(/\/+$/, "");

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;

  return "http://localhost:3000";
}

export const siteUrl = resolveSiteUrl();

/** `metadataBase` wants a URL instance; build it once rather than per route. */
export const siteUrlObject = new URL(siteUrl);

/** Absolute URL for a site-relative path, for JSON-LD and the sitemap. */
export const absoluteUrl = (path = "/"): string =>
  new URL(path, siteUrl).toString();

/**
 * Ground colour of the brand mark, shared by the OG image, the app icons and
 * the manifest. Kept here rather than read from `globals.css` because none of
 * those render through the browser's CSS pipeline.
 */
export const brand = {
  background: "#0b0f10",
  foreground: "#e8edee",
  muted: "#8a959a",
  border: "#212829",
  accent: "#22d3ee",
  /** The light theme's ground, for the light-scheme `theme-color`. */
  backgroundLight: "#f7f8f8",
} as const;
