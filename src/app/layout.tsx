import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Providers } from "@/components/layout/providers";
import { getProfile, getSkills } from "@/lib/content";
import { metaDescription } from "@/lib/seo";
import { brand, siteUrlObject } from "@/lib/site";
import "./globals.css";

/** Tight grotesk for display and prose. */
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

/** Carries every piece of structure: labels, numbers, dates, metadata. */
const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

/** Groups that describe capability. Tools and practices aren't search terms. */
const KEYWORD_GROUPS = ["Languages", "Frameworks & libraries", "Database & backend"];

/**
 * Metadata is derived from the CMS rather than hard-coded, so editing the
 * profile in the Studio updates the title, the description and the shared
 * card too — otherwise the page says one thing and the search result another.
 *
 * `getProfile` and `getSkills` are memoised, so the page body reuses these
 * fetches instead of repeating them.
 */
export async function generateMetadata(): Promise<Metadata> {
  const [profile, skills] = await Promise.all([getProfile(), getSkills()]);

  const title = `${profile.name} — ${profile.title}`;
  const description = metaDescription(profile);

  const keywords = [
    profile.name,
    profile.title,
    ...skills
      .filter((group) => KEYWORD_GROUPS.includes(group.title))
      .flatMap((group) => group.items),
  ];

  return {
    metadataBase: siteUrlObject,
    title: {
      default: title,
      template: `%s — ${profile.name}`,
    },
    description,
    keywords,
    applicationName: profile.name,
    authors: [{ name: profile.name, url: siteUrlObject.toString() }],
    creator: profile.name,
    publisher: profile.name,
    // One page, one canonical. Anything with a query string or a stray
    // trailing path still points back here.
    alternates: { canonical: "/" },
    openGraph: {
      title,
      description,
      url: "/",
      siteName: profile.name,
      type: "profile",
      locale: "en_PH",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    // The page prints an email address; leave it as text rather than letting
    // iOS turn it into a tappable link it styles itself.
    formatDetection: { email: false, address: false, telephone: false },
  };
}

/**
 * `themeColor` moved out of `metadata` in Next 14. Both schemes are declared
 * so the browser chrome matches whichever theme `next-themes` resolves to.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: brand.backgroundLight },
    { media: "(prefers-color-scheme: dark)", color: brand.background },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
        {/*
          Real-user Core Web Vitals. Renders nothing and ships its own
          Suspense boundary, so it sits in the server layout as-is. Only
          reports on Vercel — a no-op locally.
        */}
        <SpeedInsights />
      </body>
    </html>
  );
}
