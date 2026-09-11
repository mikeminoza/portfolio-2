import { createClient, type SanityClient } from "next-sanity";
import imageUrlBuilder from "@sanity/image-url";
import type { SanityImageSource } from "@sanity/image-url";
import { apiVersion, dataset, isSanityConfigured, projectId } from "./env";

/**
 * Built lazily: `createClient` throws on an empty projectId, and the app is
 * meant to run on seed content before a Sanity project exists.
 */
let cachedClient: SanityClient | undefined;

export function getClient(): SanityClient {
  if (!isSanityConfigured) {
    throw new Error(
      "Sanity is not configured. Set NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local.",
    );
  }

  cachedClient ??= createClient({ projectId, dataset, apiVersion, useCdn: true });
  return cachedClient;
}

let cachedBuilder: ReturnType<typeof imageUrlBuilder> | undefined;

/**
 * Build a CDN URL for a Sanity image. Respects the hotspot set in the Studio,
 * so crops stay sensible at any aspect ratio.
 */
export function urlFor(source: SanityImageSource) {
  cachedBuilder ??= imageUrlBuilder({ projectId, dataset });
  return cachedBuilder.image(source).auto("format").fit("crop");
}
