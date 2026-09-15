import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/layout/providers";
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

const title = "Mike Arthur Miñoza — Full-Stack Developer";
const description =
  "Full-stack developer in Cebu City building web applications end to end — Laravel and PHP on the server, React, Vue and Next.js on the front.";

export const metadata: Metadata = {
  title: {
    default: title,
    template: "%s — Mike Arthur Miñoza",
  },
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "en_PH",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
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
      </body>
    </html>
  );
}
