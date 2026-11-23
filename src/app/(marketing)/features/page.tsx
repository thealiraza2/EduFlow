import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";
import {
  Users,
  GraduationCap,
  Layers,
  QrCode,
  Receipt,
  FileSpreadsheet,
  Calendar,
  FileCheck2,
  Sparkles,
  TrendingDown,
  MessageSquare,
  Building2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  School,
  HeartHandshake,
} from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Features & Modules — EduFlow",
  description:
    "Explore the 12 core modules of EduFlow school management software: admissions, QR attendance, fee challans, Punjab board paper generator, and AI analytics.",
};

export default function FeaturesPage() {
  const modules = [
    {
      icon: Users,
      title: "Student Management",
      description:
        "Complete student lifecycle profiles, roll numbers, guardian contacts, admission history, and student status tracking.",
      tag: "Core",
    },
    {
      icon: GraduationCap,
      title: "Teacher Management",
      description:
        "Faculty profiles, subject allocations, class workload distribution, qualification records, and monthly salary disbursement.",
      tag: "Academic",
    },
    {
      icon: Layers,
      title: "Class & Batch Management",
      description:
        "Flexible classes, section assignments, morning and evening batch management, student capacities, and subject assignments.",
      tag: "Operations",
    },
    {
      icon: QrCode,
      title: "Attendance (QR)",
      description:
        "10-minute secure rotating QR codes for instant student self-scan or manual 30-second teacher roll call with WhatsApp alert triggers.",
      tag: "Automated",
    },
    {
      icon: Receipt,
      title: "Fees & Billing (Challan PDF)",
      description:
        "Automated 3-part bank fee challans (Student, Bank, Academy copy), fee structure setups, defaulter tracking, and receipt generation.",
      tag: "Finance",
    },
    {
      icon: FileSpreadsheet,
      title: "Exams & Results",
      description:
        "Comprehensive exam builder, mark sheets, grade evaluation, and one-click printable report cards with parent portal publishing.",
      tag: "Academic",
    },
    {
      icon: Calendar,
      title: "Timetable",
      description:
        "Conflict-free schedule planner for classrooms, teachers, and subjects across morning and evening sessions.",
      tag: "Operations",
    },
    {
      icon: FileCheck2,
      title: "Online Test Engine",
      description:
        "Timed online MCQ tests, question bank randomization, automated instant scoring, and detailed performance scorecards.",
      tag: "Assessment",
    },
    {
      icon: Sparkles,
      title: "AI Paper Generator",
      description:
        "288 Punjab board pairing schemes (BISE Lahore, Rawalpindi, Faisalabad, etc.) with teacher verification and Word/PDF export.",
      tag: "AI Powered",
    },
    {
      icon: TrendingDown,
      title: "AI Risk Analytics",
      description:
        "Early student dropout risk detection using machine learning across attendance dips, fee delays, and test mark patterns.",
      tag: "AI Powered",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Bot",
      description:
        "Automated WhatsApp absence notices and fee challan alerts via official Meta WhatsApp Business Cloud API.",
      tag: "Communication",
    },
    {
      icon: Building2,
      title: "Multi-Branch",
      description:
        "Centralized oversight for academy chains with unified multi-campus reporting and strictly isolated branch administrator roles.",
      tag: "Enterprise",
    },
  ];

  const audiences = [
    {
      icon: School,
      role: "Administrators & Principals",
      tagline: "Total Operational Visibility",
      points: [
        "Real-time revenue, fee collection, and outstanding defaulter tracking",
        "Faculty attendance, teaching load, and salary disbursements",
        "Campus-wide analytics and automated Punjab board scheme audits",
      ],
    },
    {
      icon: GraduationCap,
      role: "Teachers & Faculty",
      tagline: "Save Hours of Administrative Work",
      points: [
        "Take daily attendance in 30 seconds via mobile or roll call",
        "Generate authentic Punjab board exam papers in under 2 minutes",
        "Enter marks quickly and publish automated result cards instantly",
      ],
    },
    {
      icon: HeartHandshake,
      role: "Parents & Guardians",
      tagline: "Peace of Mind & Direct Updates",
      points: [
        "Instant WhatsApp alert if student is marked absent",
        "View term results, marks breakdown, and teacher feedback online",
        "Download fee challan copies and monitor payment status anytime",
      ],
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-ink">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-b from-primary-tint/50 to-white border-b border-amber-100/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>POWERFUL MODULES • BUILT FOR PAKISTAN</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink leading-[1.15] max-w-4xl mx-auto">
              Everything You Need to Run Your{" "}
              <span className="text-accent">Institution</span>
            </h1>

            <p className="mt-5 text-lg sm:text-xl text-ink-2 leading-relaxed max-w-2xl mx-auto">
              12 specialized modules designed specifically for Pakistani schools and coaching academies.
              From admissions and 30-second QR attendance to 3-part fee challans and board paper generation.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-white hover:bg-primary-hover shadow-2 transition-all active:scale-[0.99] min-h-[48px] w-full sm:w-auto"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-ink hover:bg-gray-50 shadow-1 transition-all min-h-[48px] w-full sm:w-auto"
              >
                <span>View Pricing Plans</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 12 Modules Bento Grid */}
        <section id="modules" className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>COMPLETE FEATURE MATRIX</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                The 12 Core <span className="text-accent">EduFlow Modules</span>
              </h2>
              <p className="text-base text-ink-2">
                Zero fluff. Built to replace manual registers, Excel files, and disjointed tools with one integrated solution.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {modules.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.title}
                    className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-1 hover:shadow-2 hover:border-primary/50 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center text-accent">
                          <Icon className="w-6 h-6 stroke-[2.2]" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                          {m.tag}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-ink mb-2">{m.title}</h3>
                      <p className="text-sm text-ink-2 leading-relaxed">{m.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Dashboard Mockup Banner */}
        <section className="py-16 md:py-20 bg-primary-tint/60 border-y border-amber-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-white px-3.5 py-1 text-xs font-semibold text-ink uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>UNIFIED DASHBOARD</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight leading-tight">
                  All 12 Modules, Unified in <span className="text-accent">One Real-Time Screen</span>
                </h2>
                <p className="text-base text-ink-2 leading-relaxed">
                  No more switching between separate software for attendance, fees, and examination results.
                  EduFlow brings every department into sync with real-time updates and automated alerts.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Real-time enrollment, teacher workload, and live fee collection statistics</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>Automated alerts sent directly to administration and parents via WhatsApp</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm font-semibold text-ink">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <span>100% cloud-based: access securely from any mobile, tablet, or laptop</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 flex justify-center">
                <div className="w-full max-w-lg shadow-3 rounded-2xl overflow-hidden border border-gray-200/90">
                  <DashboardPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tailored Audience Cards (Admins / Teachers / Parents) */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>EXPERIENCE FOR EVERY STAKEHOLDER</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                Designed for <span className="text-accent">Your Entire Institution</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {audiences.map((aud) => {
                const Icon = aud.icon;
                return (
                  <div
                    key={aud.role}
                    className="rounded-2xl border border-gray-200 bg-white p-7 shadow-1 flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center text-accent mb-5">
                        <Icon className="w-6 h-6 stroke-[2.2]" />
                      </div>
                      <h3 className="text-xl font-semibold text-ink">{aud.role}</h3>
                      <p className="text-xs font-semibold text-accent uppercase tracking-wider mt-1 mb-4">
                        {aud.tagline}
                      </p>
                      <ul className="space-y-3 pt-2 text-sm text-ink-2">
                        {aud.points.map((pt) => (
                          <li key={pt} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20 bg-primary text-white">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Ready to Upgrade Your Academy to <span className="text-accent">EduFlow</span>?
            </h2>
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto">
              Start your 14-day free trial today. Set up in less than 5 minutes. No credit card required.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white hover:bg-primary-hover shadow-2 transition-all active:scale-[0.99] whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Get Started Free</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-transparent px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-all"
              >
                <span>Talk to Us</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
