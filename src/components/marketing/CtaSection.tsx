import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-[#0F2040] py-16 px-6 sm:py-20 sm:px-12 text-center overflow-hidden shadow-2xl">
          {/* Subtle Ambient Background Light */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#F5B800]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Get Started with <span className="text-[#F5B800]">EduFlow</span> Today
            </h2>

            <p className="text-lg text-gray-300 max-w-xl mx-auto leading-relaxed">
              Automate attendance, fees, and results with a 14-day free trial. Setup takes under 5 minutes.
            </p>

            <div className="pt-2 flex justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-9 py-4 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-lg transition-all active:scale-[0.99]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
