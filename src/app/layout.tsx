import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "Mike Arthur Miñoza — Backend Web Developer";
const description =
  "Backend developer in Cebu City building PHP and Laravel applications on MySQL, and integrating their APIs with React, Vue and Next.js frontends.";

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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
