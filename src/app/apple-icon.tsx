import { ImageResponse } from "next/og";
import { brand } from "@/lib/site";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";
export const alt = "MAM monogram";

/**
 * Home-screen icon for iOS, which ignores SVG favicons and wants a 180px PNG.
 *
 * Same construction as `icon.svg` — the M alone with the A's accent crossbar —
 * redrawn at this size rather than upscaled, so the strokes stay on whole
 * pixels. Ground is solid because iOS composites the icon onto the wallpaper.
 */
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: brand.background,
        }}
      >
        <svg width="180" height="180" viewBox="0 0 32 32" fill="none">
          <g
            stroke={brand.foreground}
            strokeWidth="2.5"
            strokeLinecap="butt"
            strokeLinejoin="miter"
          >
            <path d="M8 23V9l8 9 8-9v14" />
          </g>
          <path d="M11 26.5h10" stroke={brand.accent} strokeWidth="2.5" />
        </svg>
      </div>
    ),
    size,
  );
}
