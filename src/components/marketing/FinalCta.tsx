"use client";

import { ArrowRight, CheckCircle2, MessageCircle } from "lucide-react";

export function FinalCta() {
  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", href);
    }
  };

  return (
    <section className="bg-pine text-white py-20 md:py-28 relative overflow-hidden">
      {/* Subtle organic background decoration */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#FAF7F2_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Setup in Under 2 Minutes</span>
        </div>

        <h2 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.15] max-w-3xl mx-auto">
          Apni academy ko aaj hi digital karo.
        </h2>

        <p className="text-base sm:text-xl text-[#E2EFE7] max-w-2xl mx-auto leading-relaxed font-sans">
          Paper registers, proxy attendance, aur manual fee ledger se nijat payein. 14 din tak poora software baghair kisi charge ke aazmayein.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
          <a
            href="#trial"
            onClick={(e) => handleScrollTo(e, "#trial")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-pine shadow-lg hover:bg-[#FAF7F2] active:scale-[0.99] transition-all cursor-pointer min-h-[48px]"
          >
            <span>Start 14-Day Free Trial</span>
            <ArrowRight className="w-4 h-4" />
          </a>

          <a
            href="#contact"
            onClick={(e) => handleScrollTo(e, "#contact")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-transparent px-8 py-4 text-base font-semibold text-white hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer min-h-[48px]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contact Support</span>
          </a>
        </div>

        {/* Micro Guarantees */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-[#C5E1D1]">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>14-day free trial</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No credit card required</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>288 Punjab Pairing Schemes</span>
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>JazzCash & Easypaisa ready</span>
          </span>
        </div>
      </div>
    </section>
  );
}
