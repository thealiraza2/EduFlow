import Link from "next/link";
import Image from "next/image";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { DashboardPreview } from "./DashboardPreview";

export function HeroSection() {
  const checkmarks = ["Easy to Use", "Secure & Reliable", "24/7 Support"];

  return (
    <section className="relative overflow-visible pt-6 pb-24 sm:pt-8 sm:pb-28 lg:pt-8 lg:pb-32 xl:pb-36 bg-white">
      {/* Background Decorative Accents */}
      <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-[#FFF9E6] rounded-full blur-3xl opacity-70" />
      <div className="absolute bottom-10 left-10 -z-10 w-80 h-80 bg-amber-50/50 rounded-full blur-2xl opacity-60" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Eyebrow, H1, Copy, Checkmarks, Buttons */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
              <span>SMARTER SCHOOLS • BETTER TOMORROW</span>
            </div>

            {/* H1 with one word highlighted in yellow */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2040] tracking-tight leading-[1.15]">
              Complete School Management{" "}
              <span className="text-[#F5B800]">System</span>
            </h1>

            {/* Subhead / Copy */}
            <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-xl">
              Streamline your school operations with an all-in-one platform. Manage students, teachers, classes, attendance, fees, exams and more — all in one place.
            </p>

            {/* 3 Checkmarks */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
              {checkmarks.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm font-semibold text-[#0F2040]">
                  <div className="w-5 h-5 rounded-full bg-[#FFF9E6] border border-[#F5B800]/50 flex items-center justify-center text-[#F5B800] shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            {/* CTAs: Get Started Free + Learn More (Visible without scrolling) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-7 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99] min-h-[48px] whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Get Started Free</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>

              <a
                href="#features"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-7 py-3.5 text-base font-semibold text-[#0F2040] hover:bg-gray-50 hover:border-[#0F2040] shadow-sm transition-all min-h-[48px] whitespace-nowrap"
              >
                <span className="whitespace-nowrap">Learn More</span>
              </a>
            </div>
          </div>

          {/* Right Column: Hero student photo card + floating dashboard mockup overlapping bottom edge */}
          <div className="lg:col-span-6 relative pt-2 lg:pt-0 mb-36 sm:mb-40 lg:mb-24 xl:mb-28">
            <div className="relative max-w-lg mx-auto lg:max-w-none">
              {/* Fully Visible Student Photo Card (NO dark overlays) */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200/80 bg-[#FFF9E6]/30 aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] w-full">
                <Image
                  src="/images/hero-student.jpg"
                  alt="Smiling schoolgirl in uniform holding books in bright classroom"
                  fill
                  priority
                  quality={95}
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover object-[center_12%] select-none"
                />
              </div>

              {/* Floating Real JSX Dashboard Mockup overlapping bottom edge */}
              <div className="absolute top-[75%] left-2 right-2 sm:left-4 sm:right-auto sm:w-[92%] lg:-left-6 lg:w-[88%] max-w-md z-20">
                <DashboardPreview />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
