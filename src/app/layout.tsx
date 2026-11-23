import type { Metadata, Viewport } from "next";
import { siteUrl } from "@/lib/site-url";
import { Bricolage_Grotesque, IBM_Plex_Mono, Instrument_Sans } from "next/font/google";
import "./globals.css";

// UI + body: crisp, slightly narrow grotesque with good tabular figures.
const sans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

// Display: characterful grotesque with optical sizes — headlines and big numbers.
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-serif",
  display: "swap",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "EduFlow — School Management System",
  description:
    "Attendance, fees, results and parent updates for schools and academies in Pakistan — in one fast, reliable system.",
  applicationName: "EduFlow",
  openGraph: {
    siteName: "EduFlow",
    type: "website",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "EduFlow — school management" }],
  },
  twitter: { card: "summary_large_image", images: ["/images/og-image.png"] },
};

export const viewport: Viewport = {
  themeColor: "#0B1030",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="eduflow" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
