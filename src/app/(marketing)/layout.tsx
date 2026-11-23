import type { Metadata } from "next";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "EduFlow — Complete School Management System",
  description:
    "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more — all in one place.",
  openGraph: {
    title: "EduFlow — Complete School Management System",
    description:
      "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more.",
    url: "/",
    siteName: "EduFlow",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "EduFlow — school management",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EduFlow — Complete School Management System",
    description:
      "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more.",
    images: ["/images/og-image.png"],
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      {/* Main content slot */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
