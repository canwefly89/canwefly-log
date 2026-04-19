import type { Metadata } from "next";
import { Geist_Mono, Instrument_Serif } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { ThemeProvider } from "@/components/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://canwefly-log.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "canwefly-log",
    template: "%s · canwefly-log",
  },
  description:
    "Writing on FE, AI engineering, and the space between. 프론트엔드 6년차의 AI 탐험 기록.",
  openGraph: {
    title: "canwefly-log",
    description:
      "Writing on FE, AI engineering, and the space between. 프론트엔드 6년차의 AI 탐험 기록.",
    url: siteUrl,
    siteName: "canwefly-log",
    type: "website",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "canwefly-log",
    description:
      "Writing on FE, AI engineering, and the space between.",
  },
  alternates: {
    types: {
      "application/rss+xml": [{ url: "/rss.xml", title: "canwefly-log" }],
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${geistMono.variable} ${instrumentSerif.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.css"
          crossOrigin="anonymous"
        />
      </head>
      <body className="relative min-h-screen flex flex-col antialiased">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <div className="grain-overlay" aria-hidden="true" />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
