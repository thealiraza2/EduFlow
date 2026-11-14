import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — EduFlow",
  description: "Privacy policy regarding student data isolation, security, and communications.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-[#0F2040] font-semibold hover:text-[#F5B800] transition-colors mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to EduFlow</span>
      </Link>

      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/30 bg-[#FFF9E6] px-3.5 py-1 text-xs font-semibold text-[#0F2040]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#F5B800]" />
          <span>Privacy & Data Protection</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#0F2040]">
          Privacy Policy
        </h1>

        <p className="text-sm text-[#6B7280]">Last updated: November 2026</p>

        <div className="prose prose-stone max-w-none text-[#4B5563] space-y-6 text-sm sm:text-base leading-relaxed pt-4 font-sans">
          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F2040]">1. Strict Tenant Isolation</h2>
            <p>
              EduFlow is built on a multi-tenant architecture. Every academy or school has its own isolated data realm. Your students, fee invoices, phone numbers, and test results are never merged, shared, or accessible by any other academy using the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F2040]">2. Information We Store</h2>
            <p>
              We collect and store only the data strictly required to manage your educational institute:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[#4B5563]">
              <li>Administrator and faculty contact credentials (name, email, phone).</li>
              <li>Enrolled student records (name, roll/admission number, class, section, batch).</li>
              <li>Guardian contact phone numbers for attendance alerts and fee challans.</li>
              <li>Examination papers, marks, and attendance timestamps.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F2040]">3. Messaging & Communications</h2>
            <p>
              Parent mobile numbers are strictly utilized to dispatch verified transactional notifications (daily absence notices, fee receipt confirmations, and result publications) triggered by your institute. We never sell, monetize, or send unsolicited commercial advertisements to student guardians.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-bold text-[#0F2040]">4. Data Ownership & Export</h2>
            <p>
              Your school retains 100% full legal ownership of its data. You may export student rosters, attendance sheets, and fee ledgers at any time. If you decide to discontinue your subscription, your data is retained for 30 days to allow complete export before permanent deletion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
