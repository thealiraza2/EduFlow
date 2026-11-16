import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ContactFormInteractive } from "@/components/marketing/ContactFormInteractive";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Contact Us — EduFlow",
  description:
    "Get in touch with the EduFlow team. Inquire about pricing, book a live demo, or get technical support for your school or academy.",
};

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#0F2040]">
      <Header />

      <main className="flex-1">
        <ContactFormInteractive />
      </main>

      <Footer />
    </div>
  );
}
