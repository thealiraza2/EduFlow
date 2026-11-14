import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

export function HeroSection() {
  const checkmarks = ["Easy to Use", "Secure & Reliable", "24/7 Support"];

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28 bg-white">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-[#FFF9E6] rounded-full blur-3xl opacity-70" />
      <div className="absolute bottom-10 left-10 -z-10 w-80 h-80 bg-amber-50/50 rounded-full blur-2xl opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          {/* Left Column: Eyebrow, H1, Copy, Checkmarks, Buttons */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-8">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
              <span>SMARTER SCHOOLS • BETTER TOMORROW</span>
            </div>

            {/* H1 with one word highlighted in yellow */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F2040] tracking-tight leading-[1.14]">
              Complete School Management{" "}
              <span className="text-[#F5B800]">System</span>
            </h1>

            {/* Subhead / Copy */}
            <p className="text-lg sm:text-xl text-[#4B5563] leading-relaxed max-w-xl">
              Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more — all in one place.
            </p>

            {/* 3 Checkmarks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 pt-1">
              {checkmarks.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#0F2040]">
                  <div className="w-5 h-5 rounded-full bg-[#FFF9E6] border border-[#F5B800]/50 flex items-center justify-center text-[#F5B800] shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs: Get Started Free + Learn More */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-7 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99] min-h-[48px]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-[#0F2040] hover:bg-gray-50 hover:border-[#0F2040] shadow-sm transition-all min-h-[48px]"
              >
                <span>Learn More</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero student photo + floating dashboard mockup */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-3xl overflow-hidden border border-gray-200/80 shadow-xl bg-gray-100 min-h-[420px] sm:min-h-[520px] flex items-center justify-center p-3 sm:p-6 lg:p-7">
              {/* AI-Generated Real Student Photo */}
              <div className="absolute inset-0">
                <Image
                  src="/images/hero-student.jpg"
                  alt="Smiling schoolgirl in uniform holding books in bright classroom"
                  fill
                  priority
                  quality={90}
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-top select-none"
                />
                {/* Contrast gradient overlay for crisp readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent sm:bg-black/25" />
              </div>

              {/* Floating Real JSX Dashboard Mockup */}
              <div className="relative z-10 w-full flex justify-center">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
