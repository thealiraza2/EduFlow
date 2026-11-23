import type { Metadata } from "next";
import "./globals.css";

export const dynamic = "force-static";

export const metadata: Metadata = {
  metadataBase: new URL("https://eduflow.app"),
  title: "EduFlow — Complete School Management System",
  description:
    "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more — all in one place.",
  openGraph: {
    title: "EduFlow — Complete School Management System",
    description:
      "Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more.",
    url: "https://eduflow.app",
    siteName: "EduFlow",
    images: [
      {
        url: "/images/hero-classroom.jpg",
        width: 1200,
        height: 675,
        alt: "EduFlow School Management System",
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
    images: ["/images/hero-classroom.jpg"],
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
