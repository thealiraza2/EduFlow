"use client";

import { useState } from "react";
import { Check, Sparkles } from "lucide-react";

export function PricingSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      name: "Starter",
      description: "For individual tutors & coaching batches up to 100 students.",
      monthlyPrice: "PKR 2,500",
      annualPrice: "PKR 25,000",
      periodLabel: isAnnual ? "/ year" : "/ month",
      savingsNote: isAnnual ? "Pay 10 months, get 12 (Save PKR 5,000)" : "Billed monthly",
      studentsLimit: "Up to 100 students",
      isPopular: false,
      features: [
        "Full admissions & student directory",
        "3-copy fee challan PDF generator",
        "10-Minute HMAC QR attendance",
        "All 288 Punjab BISE pairing schemes",
        "JazzCash & Easypaisa fee collection",
        "WhatsApp & SMS alerts (at actual carrier cost)",
        "Standard email & portal support",
      ],
    },
    {
      name: "Growth",
      description: "For expanding academies & coaching institutes with multiple classes.",
      monthlyPrice: "PKR 5,000",
      annualPrice: "PK0 50,000".replace("PK0", "PKR"), // PKR 50,000
      periodLabel: isAnnual ? "/ year" : "/ month",
      savingsNote: isAnnual ? "Pay 10 months, get 12 (Save PKR 10,000)" : "Billed monthly",
      studentsLimit: "101 to 500 students",
      isPopular: true,
      features: [
        "Everything in Starter included",
        "Multi-batch & subject timetable scheduling",
        "Online test engine (timed MCQs & auto-grading)",
        "Board-aware AI test paper generator",
        "Deterministic dropout risk analytics",
        "Batch leaderboard & published report cards",
        "Priority WhatsApp & phone assistance",
      ],
    },
    {
      name: "Pro",
      description: "For large institutions, colleges & multi-branch academy networks.",
      monthlyPrice: "PKR 9,000",
      annualPrice: "PKR 90,000",
      periodLabel: isAnnual ? "/ year" : "/ month",
      savingsNote: isAnnual ? "Pay 10 months, get 12 (Save PKR 18,000)" : "Billed monthly",
      studentsLimit: "500+ students & multi-branch",
      isPopular: false,
      features: [
        "Everything in Growth included",
        "Multi-branch SaaS tenant management",
        "500 free WhatsApp outbound alerts / month",
        "SuperAdmin central governance & billing",
        "Custom academy subdomains",
        "Dedicated onboarding & free CSV data migration",
        "99.9% uptime SLA & account manager",
      ],
    },
  ];

  const handleScrollToTrial = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const trialSection = document.getElementById("trial");
    if (trialSection) {
      trialSection.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", "#trial");
    }
  };

  return (
    <section id="pricing" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-pine" />
          <span>Transparent Pricing</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
          Saanf aur transparent pricing.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#55534D] leading-relaxed font-sans">
          Har plan mein poora feature suite shaamil hai. Farq sirf student limit aur WhatsApp quota ka hai — koi hidden setup fee nahi.
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="mt-8 flex items-center justify-center gap-3">
          <span
            onClick={() => setIsAnnual(false)}
            className={`text-sm font-medium cursor-pointer transition-colors ${
              !isAnnual ? "text-ink font-semibold" : "text-[#787670]"
            }`}
          >
            Monthly
          </span>

          <button
            type="button"
            onClick={() => setIsAnnual(!isAnnual)}
            className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-pine ${
              isAnnual ? "bg-pine" : "bg-[#DDD6C8]"
            }`}
            role="switch"
            aria-checked={isAnnual}
            aria-label="Toggle annual billing"
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isAnnual ? "translate-x-7" : "translate-x-0"
              }`}
            />
          </button>

          <span
            onClick={() => setIsAnnual(true)}
            className={`text-sm font-medium cursor-pointer transition-colors flex items-center gap-2 ${
              isAnnual ? "text-ink font-semibold" : "text-[#787670]"
            }`}
          >
            <span>Annual</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#EBF3EE] text-pine border border-[#CDE1D4]">
              Pay 10 mo, get 12
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl border flex flex-col justify-between p-7 sm:p-8 transition-all duration-200 relative ${
              plan.isPopular
                ? "bg-[#FAF8F4] border-pine shadow-lg md:-translate-y-2 ring-1 ring-pine/20"
                : "bg-white border-[#DDD6C8] shadow-sm hover:border-[#C8BFAD]"
            }`}
          >
            {/* Most Popular Badge */}
            {plan.isPopular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pine text-white shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Most Popular</span>
                </span>
              </div>
            )}

            <div>
              {/* Plan Title & Cap */}
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold text-ink">{plan.name}</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFEAE0] text-[#4A4843] border border-[#DDD6C8]">
                  {plan.studentsLimit}
                </span>
              </div>

              <p className="mt-2 text-xs sm:text-sm text-[#55534D] leading-relaxed">
                {plan.description}
              </p>

              {/* Price Display */}
              <div className="mt-6 pb-6 border-b border-[#EAE4D8]">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-3xl sm:text-4xl font-bold text-ink tracking-tight">
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span className="text-xs sm:text-sm text-[#6B6B64] font-medium">
                    {plan.periodLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs text-pine font-medium">
                  {plan.savingsNote}
                </p>
              </div>

              {/* Inclusions List */}
              <div className="mt-6 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-ink">
                  Included in this plan:
                </p>
                <ul className="space-y-2.5 text-xs sm:text-sm text-[#4A4843]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* CTA Button */}
            <div className="mt-8 pt-6 border-t border-[#EAE4D8]">
              <a
                href="#trial"
                onClick={handleScrollToTrial}
                className={`w-full inline-flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                  plan.isPopular
                    ? "bg-pine text-white hover:bg-pine-hover shadow-sm"
                    : "border border-[#D5CEC2] bg-white text-ink hover:bg-[#F3EFE7]"
                }`}
              >
                Start 14-Day Free Trial
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
