import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service — AcademyHub",
  description: "Clear and straightforward terms of service for schools and tuition academies.",
};

export default function TermsPage() {
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
          <FileText className="w-3.5 h-3.5 text-pine" />
          <span>Platform Agreement</span>
        </div>

        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-ink">
          Terms of Service
        </h1>

        <p className="text-sm text-[#78756F]">Last updated: November 2026</p>

        <div className="prose prose-stone max-w-none text-[#4A4843] space-y-6 text-sm sm:text-base leading-relaxed pt-4 font-sans">
          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">1. 14-Day Free Trial</h2>
            <p>
              Every new academy is entitled to an unrestricted 14-day free trial of the full Pro tier. No payment method or credit card is required at sign-up. At the end of the 14-day period, access is paused until you select an active subscription plan. You will never be charged automatically.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">2. Subscriptions & Billing</h2>
            <p>
              AcademyHub offers three transparent tiers: Starter (PKR 2,500/mo), Growth (PKR 5,000/mo), and Pro (PKR 9,000/mo). Annual commitments provide 12 months of service for the cost of 10 months. Payments may be settled via direct bank transfer, JazzCash, or Easypaisa.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">3. Acceptable Use</h2>
            <p>
              Academies agree to use AcademyHub solely for legitimate educational administration. You are responsible for ensuring that guardian phone numbers are accurate and that faculty members safeguard their authentication credentials.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="font-display text-xl font-bold text-ink">4. Service Reliability & Backups</h2>
            <p>
              We target 99.9% uptime for academy portals, parent query endpoints, and online test engines. Databases are backed up regularly, and all critical updates are applied without breaking backward compatibility.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
