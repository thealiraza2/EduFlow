import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://academyhub.app"),
  title: "AcademyHub — Academy & School Management Software",
  description:
    "The complete academy & school management platform built for Pakistan. Automate admissions, fee challans with JazzCash and Easypaisa, 10-minute QR attendance, and Punjab BISE pairing scheme test papers.",
  openGraph: {
    title: "AcademyHub — Academy & School Management Software",
    description:
      "Run your school or tuition academy with clarity. Admissions, fee challans, parent WhatsApp updates, 10-minute QR attendance, and Punjab BISE pairing schemes.",
    url: "https://academyhub.app",
    siteName: "AcademyHub",
    images: [
      {
        url: "/images/hero-classroom.jpg",
        width: 1200,
        height: 900,
        alt: "Pakistani classroom with teacher and students",
      },
    ],
    locale: "en_PK",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AcademyHub — Academy & School Management Software",
    description:
      "The complete academy and school management system built for Pakistan.",
    images: ["/images/hero-classroom.jpg"],
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-pine selection:text-paper font-sans">
      {/* Header slot */}
      <div id="marketing-header" />
      
      {/* Main content slot */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>

      {/* Footer slot */}
      <div id="marketing-footer" />
    </div>
  );
}
