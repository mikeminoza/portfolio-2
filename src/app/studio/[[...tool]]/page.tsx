import { NextStudio } from "next-sanity/studio";
import { isSanityConfigured } from "@/sanity/env";
import config from "../../../../sanity.config";

export const dynamic = "force-static";

export { metadata, viewport } from "next-sanity/studio";

export default function StudioPage() {
  // Without credentials the Studio boots into an opaque internal error, so
  // say what's actually missing instead.
  if (!isSanityConfigured) return <SetupNotice />;

  return <NextStudio config={config} />;
}

function SetupNotice() {
  return (
    <main
      style={{
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        maxWidth: "34rem",
        margin: "0 auto",
        padding: "4rem 1.5rem",
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: "1.4rem", fontWeight: 600, marginBottom: "0.75rem" }}>
        Sanity isn&rsquo;t configured yet
      </h1>
      <p style={{ color: "#666", marginBottom: "1.25rem" }}>
        Create a project at <strong>sanity.io/manage</strong>, then copy
        <code> .env.local.example </code> to <code>.env.local</code> and fill in
        the project ID:
      </p>
      <pre
        style={{
          background: "#f4f4f5",
          padding: "1rem",
          borderRadius: "0.5rem",
          fontSize: "0.85rem",
          overflowX: "auto",
        }}
      >
        NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id{"\n"}
        NEXT_PUBLIC_SANITY_DATASET=production
      </pre>
      <p style={{ color: "#666", marginTop: "1.25rem" }}>
        Restart the dev server afterwards. The site itself runs on the seed
        content in <code>src/lib/content.ts</code> until then.
      </p>
    </main>
  );
}
