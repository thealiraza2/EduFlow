import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AcademyHub — Academy Management System",
  description: "Complete management system for tuition academies and coaching centres in Pakistan",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
