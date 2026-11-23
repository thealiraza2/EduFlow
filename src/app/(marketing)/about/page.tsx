import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import {
  Compass,
  Eye,
  Zap,
  ShieldCheck,
  Users2,
  Heart,
  ArrowRight,
  Code2,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "About Us — EduFlow",
  description:
    "Learn about EduFlow — built by a developer for Pakistani schools and academies to eliminate manual paperwork and simplify management.",
};

export default function AboutPage() {
  const values = [
    {
      icon: Zap,
      title: "Simplicity First",
      description:
        "We believe management software should be usable by any teacher or clerk in minutes, without complicated training or IT certifications.",
    },
    {
      icon: ShieldCheck,
      title: "Trust & Security",
      description:
        "Student records, family phone numbers, and financial books belong solely to the school. We guarantee strict multi-tenant isolation and data privacy.",
    },
    {
      icon: Users2,
      title: "Partnership",
      description:
        "We build alongside actual school principals and tuition centre founders, listening closely to the real day-to-day challenges of Pakistani institutions.",
    },
    {
      icon: Heart,
      title: "People Matter",
      description:
        "Software should reduce administrative stress and empower educators to spend more time inspiring students and engaging with parents.",
    },
  ];

  const stats = [
    {
      value: "288",
      label: "Punjab Board Pairing Schemes",
      desc: "Built-in coverage across 9 educational boards",
    },
    {
      value: "12",
      label: "Specialized Modules",
      desc: "From QR attendance to bank fee challans",
    },
    {
      value: "14 Days",
      label: "Free Trial",
      desc: "Zero commitment, no credit card required",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-white text-ink">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-12 pb-16 sm:pt-16 sm:pb-20 bg-gradient-to-b from-primary-tint/50 to-white border-b border-amber-100/60">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span>ABOUT EDUFLOW</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-ink leading-[1.15]">
              Built for Pakistani Schools, <br />
              <span className="text-accent">Engineered for Simplicity</span>
            </h1>

            <p className="text-lg sm:text-xl text-ink-2 leading-relaxed max-w-2xl mx-auto">
              Empowering academies, tuition centres, and schools with modern digital tools built specifically for local educational realities.
            </p>
          </div>
        </section>

        {/* Our Story — ONE honest paragraph only */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gray-200 bg-canvas p-8 sm:p-12 shadow-1 space-y-4">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
                <span>OUR STORY</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold text-ink tracking-tight">
                Why EduFlow Was Built
              </h2>
              {/* Honest paragraph with NO invented founding year or history */}
              <p className="text-base sm:text-lg text-ink-2 leading-relaxed">
                EduFlow was built by a developer for Pakistani academies and schools who were struggling with scattered paper registers, outdated desktop software, and chaotic manual record-keeping. Seeing educators spend hours every day writing fee slips by hand, calculating teacher payrolls on notebooks, and tracking attendance manually, EduFlow was engineered from the ground up to bring every operational need — from QR attendance and automated 3-part bank challans to Punjab board exam generation and parent updates — into one fast, dependable, and simple platform.
              </p>
            </div>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-14 md:py-18 bg-primary-tint/40 border-y border-amber-100/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Mission */}
              <div className="rounded-2xl border border-gray-200/90 bg-white p-8 shadow-1 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center text-accent">
                  <Compass className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-2xl font-semibold text-ink">Our Mission</h3>
                <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
                  To eliminate administrative friction for Pakistani educators by providing software that is effortless to use, rock-solid in reliability, and affordable for every tuition centre and school.
                </p>
              </div>

              {/* Vision */}
              <div className="rounded-2xl border border-gray-200/90 bg-white p-8 shadow-1 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center text-accent">
                  <Eye className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-2xl font-semibold text-ink">Our Vision</h3>
                <p className="text-sm sm:text-base text-ink-2 leading-relaxed">
                  To give every educational institution in Pakistan the digital backbone they need to operate professionally, communicate transparently with parents, and focus 100% on academic excellence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Values */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-12 space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>CORE VALUES</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
                Principles That Guide <span className="text-accent">Our Work</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((v) => {
                const Icon = v.icon;
                return (
                  <div
                    key={v.title}
                    className="rounded-2xl border border-gray-200/90 bg-white p-6 shadow-1 hover:shadow-2 transition-shadow"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary-tint border border-primary/30 flex items-center justify-center text-accent mb-4">
                      <Icon className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <h3 className="text-lg font-semibold text-ink mb-2">{v.title}</h3>
                    <p className="text-sm text-ink-2 leading-relaxed">{v.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Real Stats Only (NO fake numbers) */}
        <section className="py-14 md:py-18 bg-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-gray-700/50">
              {stats.map((s) => (
                <div key={s.label} className="pt-6 md:pt-0 px-4 space-y-2">
                  <div className="text-4xl sm:text-5xl font-semibold text-accent tracking-tight">
                    {s.value}
                  </div>
                  <div className="text-lg font-semibold text-white">{s.label}</div>
                  <p className="text-xs text-gray-300">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section = Ali Raza, Founder & Developer, ONLY */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center mb-10 space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary-tint px-4 py-1.5 text-xs font-semibold text-ink uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span>LEADERSHIP</span>
              </div>
              <h2 className="text-3xl font-semibold text-ink tracking-tight">
                Meet the Creator
              </h2>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-canvas p-8 sm:p-10 shadow-1 max-w-xl mx-auto">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shadow-2 border border-gray-200 shrink-0">
                  <Image
                    src="/images/ali-raza.jpg"
                    alt="Ali Raza — Founder & Developer"
                    fill
                    sizes="96px"
                    className="object-cover"
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-ink">Ali Raza</h3>
                  <div className="inline-block px-3 py-1 rounded-full bg-primary-tint border border-primary/40 text-xs font-semibold text-ink">
                    Founder & Developer
                  </div>
                  <p className="text-sm text-ink-2 leading-relaxed pt-1">
                    Software engineer building dedicated software solutions tailored to Pakistani institutions. Dedicated to building reliable, high-performance web systems that free educators from paperwork bottlenecks.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 md:py-18 bg-primary-tint border-t border-amber-100 text-center">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight">
              Ready to Modernize Your Academy?
            </h2>
            <p className="text-base text-ink-2 max-w-xl mx-auto">
              Join educators across Pakistan who manage students, QR attendance, and fees with ease.
            </p>
            <div className="pt-2 flex justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-white hover:bg-primary-hover shadow-2 transition-all active:scale-[0.99]"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
