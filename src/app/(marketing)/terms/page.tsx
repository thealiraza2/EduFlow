import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — EduFlow",
  description: "Terms and conditions for utilizing the EduFlow school management platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#0F2040]">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[#0F2040] font-semibold hover:text-[#F5B800] transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/30 bg-[#FFF9E6] px-3.5 py-1 text-xs font-semibold text-[#0F2040]">
            <FileText className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>Legal Agreement</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F2040]">
            Terms of Service
          </h1>

          <p className="text-sm text-[#6B7280]">Last updated: November 2026</p>

          <div className="prose prose-stone max-w-none text-[#4B5563] space-y-6 text-sm sm:text-base leading-relaxed pt-4 font-sans">
            <section className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F2040]">1. Service Agreement</h2>
              <p>
                By creating a trial tenant or subscribing to EduFlow, you represent that you are an authorized representative of your academy or educational institution. EduFlow grants your institute a non-exclusive, revocable license to access the cloud software platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F2040]">2. Subscription & Payments</h2>
              <p>
                EduFlow is provided on a monthly or annual subscription basis. Tiered plans (Starter, Growth, Pro) are determined by the count of active enrolled students. Payments are processed in Pakistani Rupees (PKR) without hidden setup fees.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F2040]">3. WhatsApp Cloud API Terms</h2>
              <p>
                WhatsApp notification features utilize Meta&apos;s Cloud API. Message delivery costs are determined by Meta&apos;s utility message pricing (~PKR 4.20/msg). Institutions must adhere to WhatsApp&apos;s business messaging guidelines and obtain guardian consent before dispatching transactional notifications.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-bold text-[#0F2040]">4. Service Availability & Uptime</h2>
              <p>
                We aim for 99.9% platform availability. Regular maintenance windows are scheduled during low-usage overnight hours. Emergency data backups occur continuously to safeguard student and financial ledgers.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
