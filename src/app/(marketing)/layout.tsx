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
        url: "/images/hero-student.jpg",
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
    images: ["/images/hero-student.jpg"],
  },
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0F2040] selection:bg-[#F5B800] selection:text-[#0F2040] font-sans">
      {/* Main content slot */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
