import { ImageResponse } from "next/og";
import { getProfile } from "@/lib/content";
import { brand } from "@/lib/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Mike Arthur Miñoza — Full-Stack Developer";

/**
 * The card that renders when the site is pasted into Slack, LinkedIn or X.
 *
 * Built from the same profile the page renders, so it can't drift from the
 * CV, and laid out in the site's own language: hairline rules, a mono label
 * row, one teal signal. No custom font is loaded — the typeface would cost a
 * network fetch at build time and the composition carries the identity.
 *
 * Satori only supports flexbox, so every container here is explicitly flex.
 */
export default async function OpengraphImage() {
  const profile = await getProfile();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: brand.background,
          color: brand.foreground,
          padding: "64px 72px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Label row — the same 11px mono rail the page opens with. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `1px solid ${brand.border}`,
            paddingTop: 20,
            fontSize: 20,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: brand.muted,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ color: brand.accent }}>00</span>
            <span style={{ margin: "0 12px" }}>/</span>
            <span>{profile.title}</span>
          </div>
          <span>{profile.location}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
            }}
          >
            {profile.name}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 92,
              fontWeight: 600,
              letterSpacing: "-0.02em",
              lineHeight: 1.05,
              color: brand.muted,
            }}
          >
            builds end to end.
          </div>
        </div>

        {/* Monogram sits opposite the accent rule, closing the frame. */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderBottom: `1px solid ${brand.border}`,
            paddingBottom: 20,
          }}
        >
          <svg width="192" height="52" viewBox="0 0 96 26" fill="none">
            <g
              stroke={brand.foreground}
              strokeWidth="2.5"
              strokeLinecap="butt"
              strokeLinejoin="miter"
            >
              <path d="M1.25 25V1l10.75 13L22.75 1v24" />
              <path d="M36.25 25 47 1l10.75 24" />
              <path d="M71.25 25V1L82 14 92.75 1v24" />
            </g>
            <path d="M41.2 16h11.6" stroke={brand.accent} strokeWidth="2.5" />
          </svg>
          <div style={{ display: "flex", width: 160, height: 3, background: brand.accent }} />
        </div>
      </div>
    ),
    size,
  );
}
