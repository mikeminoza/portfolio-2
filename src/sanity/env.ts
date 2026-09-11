export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? "";
export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";
export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2025-09-01";

/**
 * The app runs without Sanity credentials and falls back to the seed content
 * in `lib/content.ts`, so the site is never broken while the dataset is empty
 * or the env vars are missing.
 */
export const isSanityConfigured = projectId.length > 0;
