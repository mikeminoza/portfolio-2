/**
 * X and most chat clients fall back to `og:image`, but relying on a fallback
 * means the card silently depends on another platform's behaviour. Reusing
 * the same generator emits an explicit `twitter:image` for one extra static
 * PNG at build time.
 */
export { default, size, contentType, alt } from "./opengraph-image";
