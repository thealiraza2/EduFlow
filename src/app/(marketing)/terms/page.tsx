import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { ArrowLeft, FileText, Scale, Mail, ShieldAlert, Baby } from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Terms of Service — EduFlow",
  description: "Terms and conditions for utilizing the EduFlow school management platform.",
};

export default function TermsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-ink">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-ink font-semibold hover:text-accent transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-tint px-3.5 py-1 text-xs font-semibold text-ink">
            <FileText className="w-3.5 h-3.5 text-accent" />
            <span>Legal Agreement</span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-ink">
            Terms of Service
          </h1>

          <p className="text-sm text-ink-3">Last updated: November 2026</p>

          <div className="prose prose-stone max-w-none text-ink-2 space-y-6 text-sm sm:text-base leading-relaxed pt-4 font-sans">
            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">1. Service Agreement</h2>
              <p>
                By creating a trial tenant or subscribing to EduFlow, you represent that you are an authorized representative of your academy or educational institution. EduFlow grants your institute a non-exclusive, revocable license to access the cloud software platform.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">2. Subscription, Trials & Payments</h2>
              <p>
                EduFlow is provided on a monthly or annual subscription basis following an initial 14-day free trial. Tiered plans (Starter, Growth, Pro) are determined by the count of active enrolled students. Payments are processed in Pakistani Rupees (PKR) without hidden setup fees. Subscriptions can be cancelled at any time without penalty.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                <Baby className="w-5 h-5 text-accent" />
                3. Children&apos;s & Student Records Protection
              </h2>
              <p>
                Institutions using EduFlow warrant that they have lawful authority and requisite parental consent to record, manage, and process educational records of minor students. EduFlow acts as a data processor and implements strict tenant encryption boundaries to prevent unauthorized exposure.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">4. WhatsApp Cloud API Terms</h2>
              <p>
                WhatsApp notification features utilize Meta&apos;s official Cloud API. Message delivery costs are determined by Meta&apos;s utility message pricing (~PKR 4.20/msg). Institutions must adhere to WhatsApp&apos;s business messaging guidelines and obtain guardian consent before dispatching transactional notifications.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink">5. Service Availability & Uptime</h2>
              <p>
                We aim for 99.9% platform availability. Regular maintenance windows are scheduled during low-usage overnight hours. Emergency data backups occur continuously to safeguard student and financial ledgers.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                <Scale className="w-5 h-5 text-accent" />
                6. Governing Law & Dispute Resolution
              </h2>
              <p>
                These Terms of Service shall be governed by, construed, and enforced in accordance with the laws of the Islamic Republic of Pakistan. Any legal action, dispute, or proceeding arising under these Terms shall be instituted exclusively in the competent courts located in Lahore, Pakistan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold text-ink flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                7. Legal Inquiries & Notices
              </h2>
              <p>
                For official legal notices or contractual inquiries, please contact our administrative team:
              </p>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm space-y-1">
                <div><strong>Legal Department:</strong> <a href="mailto:legal@eduflow.app" className="text-blue-600 underline">legal@eduflow.app</a></div>
                <div><strong>Support:</strong> <a href="mailto:support@eduflow.app" className="text-blue-600 underline">support@eduflow.app</a></div>
                <div><strong>Jurisdiction:</strong> Lahore, Punjab, Pakistan</div>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
