import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy — AcademyHub",
  description: "Honest privacy policy regarding student data isolation, security, and WhatsApp messaging.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-pine font-medium hover:underline mb-8"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to AcademyHub</span>
      </Link>

      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink">
          <ShieldCheck className="w-3.5 h-3.5 text-pine" />
          <span>Privacy & Data Isolation</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Privacy Policy
        </h1>

        <p className="text-sm text-[#78756F]">Last updated: November 2026</p>

        <div className="prose prose-stone max-w-none text-[#4A4843] space-y-6 text-sm sm:text-base leading-relaxed pt-4 font-sans">
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">1. Strict Tenant Isolation</h2>
            <p>
              AcademyHub is built on a multi-tenant architecture. Every academy or school has its own isolated data realm. Your students, fee invoices, phone numbers, and test results are never merged, shared, or accessible by any other academy using the platform.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">2. Information We Store</h2>
            <p>
              We collect and store only the data strictly required to manage your educational institute:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-sm text-[#55534D]">
              <li>Administrator and faculty contact credentials (name, email, phone).</li>
              <li>Enrolled student records (name, roll/admission number, class, section, batch).</li>
              <li>Guardian contact phone numbers for attendance alerts and fee challans.</li>
              <li>Examination papers, marks, and attendance timestamps.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">3. Messaging & Communications</h2>
            <p>
              Parent mobile numbers are strictly utilized to dispatch verified transactional notifications (daily absence notices, fee receipt confirmations, and result publications) triggered by your institute. We never sell, monetize, or send unsolicited commercial advertisements to student guardians.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">4. Data Ownership & Export</h2>
            <p>
              Your academy retains 100% full legal ownership of its data. You may export student rosters, attendance sheets, and fee ledgers at any time. If you decide to discontinue your subscription, your data is retained for 30 days to allow complete export before permanent deletion.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
