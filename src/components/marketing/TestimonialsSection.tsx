import Link from "next/link";
import { Star, Sparkles, ArrowRight } from "lucide-react";

export function TestimonialsSection() {
  return (
    <section className="py-20 md:py-28 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-14 sm:mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
            <span>PARTNER WITH US</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2040] tracking-tight">
            Transform Your School&apos;s{" "}
            <span className="text-[#F5B800]">Operations</span>
          </h2>
        </div>

        {/* Single Honest Success Story Card */}
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl border border-amber-200/70 bg-[#FFF9E6]/60 p-8 sm:p-12 text-center shadow-sm relative overflow-hidden">
            {/* Subtle Star Rating Banner */}
            <div className="flex justify-center gap-1.5 text-[#F5B800] mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-[#F5B800]" />
              ))}
            </div>

            {/* Headline Message */}
            <h3 className="text-2xl sm:text-3xl font-bold text-[#0F2040] tracking-tight mb-4">
              Be our first success story — your academy&apos;s story could be here.
            </h3>

            <p className="text-base text-[#4B5563] leading-relaxed max-w-lg mx-auto mb-8">
              We partner closely with school administrators and tuition centres to automate daily operations, eliminate paperwork, and improve parent communication.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-8 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99]"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
