"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ArrowRight, ChevronDown, Sparkles, HelpCircle } from "lucide-react";

export function PricingInteractive() {
  const [isYearly, setIsYearly] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const plans = [
    {
      name: "Starter",
      badge: "For Tuition Centres & Small Academies",
      monthlyPrice: 2500,
      yearlyPrice: 25000,
      yearlySavings: 5000,
      students: "Up to 100 students",
      description: "Essential tools to automate attendance, bank fee challans, and basic results.",
      highlight: false,
      features: [
        "Up to 100 active students",
        "Unlimited teacher & staff logins",
        "QR Attendance (10-minute rotating tokens)",
        "3-part bank fee challan PDF (Student/Bank/Academy)",
        "Defaulter tracking & fee receipts",
        "Exams, marks entry & printable report cards",
        "AI Paper Generator (Punjab board schemes)",
        "Standard email & guided onboarding",
        "WhatsApp integration (billed at Meta API cost)",
      ],
    },
    {
      name: "Growth",
      badge: "Most Popular",
      monthlyPrice: 5000,
      yearlyPrice: 50000,
      yearlySavings: 10000,
      students: "101 – 500 students",
      description: "Complete management for growing schools and coaching institutes.",
      highlight: true,
      features: [
        "Up to 500 active students",
        "Everything in Starter included",
        "Online Test Engine with instant auto-grading",
        "AI Risk Analytics (early dropout prevention)",
        "Timetable planner across shifts & rooms",
        "Batch-wise fee structures & concessions",
        "Multi-branch support (up to 3 campuses)",
        "Priority WhatsApp support desk",
        "WhatsApp integration (billed at Meta API cost)",
      ],
    },
    {
      name: "Pro",
      badge: "For Large Schools & Academy Chains",
      monthlyPrice: 9000,
      yearlyPrice: 90000,
      yearlySavings: 18000,
      students: "500+ students (Unlimited)",
      description: "Comprehensive institutional control with dedicated support and messaging.",
      highlight: false,
      features: [
        "Unlimited student capacity",
        "Everything in Growth included",
        "Includes 500 free WhatsApp messages/mo",
        "Unlimited multi-branch campuses",
        "Custom fee head structures & challan layouts",
        "Dedicated 24/7 account manager",
        "On-demand staff & teacher training",
        "Custom data exports & board scheme updates",
      ],
    },
  ];

  const faqs = [
    {
      question: "What happens after the 14-day free trial?",
      answer:
        "You can choose either the Starter, Growth, or Pro plan to continue using EduFlow. All your students, past attendance records, and fee history remain completely intact. If you decide not to subscribe, you can export your records at any time. No credit card is required to start.",
    },
    {
      question: "Can I change plans or upgrade later?",
      answer:
        "Yes, you can upgrade, downgrade, or switch between monthly and annual plans at any time directly from your administration dashboard as your student enrollment grows.",
    },
    {
      question: "Can we migrate or import our existing student and fee data?",
      answer:
        "Yes. We offer built-in Excel/CSV bulk import templates for students, parents, and past fee balances, and our onboarding team will assist you with the migration free of charge.",
    },
    {
      question: "Is our school and student data secure?",
      answer:
        "Yes. Every academy operates in strict tenant isolation with encrypted passwords and daily automated database backups. Your students, fee invoices, and test results are never accessible by other institutions.",
    },
    {
      question: "Is WhatsApp messaging cost separate?",
      answer:
        "Yes, WhatsApp messages are billed directly by Meta at official utility message rates (~PKR 4.20 per message). EduFlow connects directly to your Meta Cloud API account with zero platform markup. Pro plans include 500 free messages per month.",
    },
  ];

  return (
    <div className="space-y-20 py-12 sm:py-16">
      {/* Pricing Header & Toggle */}
      <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
          <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
          <span>TRANSPARENT SUBSCRIPTION PLANS</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#0F2040] tracking-tight">
          Simple, Predictable <span className="text-[#F5B800]">Pricing</span>
        </h1>

        <p className="text-base sm:text-lg text-[#4B5563] max-w-2xl mx-auto">
          Choose the plan that fits your school or academy size. Every plan includes a 14-day free trial with full access to all 12 modules. No credit card required.
        </p>

        {/* Monthly / Yearly Toggle */}
        <div className="pt-4 flex items-center justify-center gap-4">
          <span className={`text-sm font-bold ${!isYearly ? "text-[#0F2040]" : "text-gray-400"}`}>
            Monthly Billing
          </span>

          <button
            type="button"
            onClick={() => setIsYearly(!isYearly)}
            className="relative w-16 h-8 rounded-full bg-[#0F2040] p-1 transition-colors focus:outline-none"
            aria-label="Toggle billing duration"
          >
            <div
              className={`w-6 h-6 rounded-full bg-[#F5B800] transition-transform duration-200 ${
                isYearly ? "translate-x-8" : "translate-x-0"
              }`}
            />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${isYearly ? "text-[#0F2040]" : "text-gray-400"}`}>
              Yearly Billing
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFF9E6] text-[#0F2040] border border-[#F5B800]/50">
              Save 2 months (Pay 10, get 12)
            </span>
          </div>
        </div>
      </div>

      {/* 3 Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((p) => {
            const price = isYearly ? p.yearlyPrice : p.monthlyPrice;
            const formattedPrice = price.toLocaleString();

            return (
              <div
                key={p.name}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-200 relative ${
                  p.highlight
                    ? "bg-[#0F2040] text-white shadow-2xl ring-2 ring-[#F5B800]"
                    : "bg-white text-[#0F2040] border border-gray-200 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Most Popular Badge */}
                {p.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#F5B800] text-[#0F2040] text-xs font-extrabold uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{p.badge}</span>
                  </div>
                )}

                <div>
                  {!p.highlight && (
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      {p.badge}
                    </span>
                  )}

                  <h3 className={`text-2xl font-bold ${p.highlight ? "text-white" : "text-[#0F2040]"}`}>
                    {p.name}
                  </h3>
                  <p className={`text-xs mt-1 mb-4 ${p.highlight ? "text-gray-300" : "text-[#4B5563]"}`}>
                    {p.description}
                  </p>

                  {/* Price */}
                  <div className="py-4 border-y border-gray-200/20 my-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xs font-bold">PKR</span>
                      <span className="text-4xl sm:text-5xl font-extrabold tracking-tight">
                        {formattedPrice}
                      </span>
                      <span className={`text-xs ${p.highlight ? "text-gray-300" : "text-gray-500"}`}>
                        {isYearly ? "/ year" : "/ month"}
                      </span>
                    </div>

                    <div className="mt-2 text-xs font-semibold">
                      <span className={p.highlight ? "text-[#F5B800]" : "text-[#0F2040]"}>
                        {p.students}
                      </span>
                      {isYearly && (
                        <span className="ml-2 text-emerald-500 font-bold">
                          • Save PKR {p.yearlySavings.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features list */}
                  <ul className="space-y-3 pt-2 text-sm">
                    {p.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                            p.highlight
                              ? "bg-[#F5B800] text-[#0F2040]"
                              : "bg-[#FFF9E6] text-[#F5B800] border border-[#F5B800]/40"
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className={p.highlight ? "text-gray-200" : "text-[#4B5563]"}>
                          {feat}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA Button */}
                <div className="pt-8">
                  <Link
                    href="/signup"
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-full py-3.5 px-6 font-bold text-sm transition-all shadow-md active:scale-[0.99] min-h-[48px] ${
                      p.highlight
                        ? "bg-[#F5B800] text-[#0F2040] hover:bg-[#DF9E00]"
                        : "bg-[#0F2040] text-white hover:bg-[#1A315C]"
                    }`}
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feature Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="max-w-3xl mx-auto text-center mb-10 space-y-2">
          <h2 className="text-3xl font-extrabold text-[#0F2040] tracking-tight">
            Detailed Feature Comparison
          </h2>
          <p className="text-sm text-[#4B5563]">
            Every plan gives you core management capabilities with honest, straightforward differences.
          </p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FFF9E6] border-b border-gray-200 text-[#0F2040]">
              <tr>
                <th className="py-4 px-6 font-bold text-sm">Feature / Module</th>
                <th className="py-4 px-6 font-bold text-sm">Starter</th>
                <th className="py-4 px-6 font-bold text-sm bg-amber-100/50">Growth</th>
                <th className="py-4 px-6 font-bold text-sm">Pro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[#4B5563]">
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Student Capacity</td>
                <td className="py-3.5 px-6">Up to 100</td>
                <td className="py-3.5 px-6 font-medium text-[#0F2040] bg-amber-50/30">101 – 500</td>
                <td className="py-3.5 px-6">500+ (Unlimited)</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Staff & Teacher Accounts</td>
                <td className="py-3.5 px-6">Unlimited</td>
                <td className="py-3.5 px-6 bg-amber-50/30">Unlimited</td>
                <td className="py-3.5 px-6">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">QR Attendance & Roll Call</td>
                <td className="py-3.5 px-6">✓ Included</td>
                <td className="py-3.5 px-6 bg-amber-50/30">✓ Included</td>
                <td className="py-3.5 px-6">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">3-Part Bank Fee Challans</td>
                <td className="py-3.5 px-6">✓ Included</td>
                <td className="py-3.5 px-6 bg-amber-50/30">✓ Included</td>
                <td className="py-3.5 px-6">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Exams & Report Cards</td>
                <td className="py-3.5 px-6">✓ Included</td>
                <td className="py-3.5 px-6 bg-amber-50/30">✓ Included</td>
                <td className="py-3.5 px-6">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">AI Paper Generator (Punjab schemes)</td>
                <td className="py-3.5 px-6">288 Schemes</td>
                <td className="py-3.5 px-6 bg-amber-50/30">288 Schemes</td>
                <td className="py-3.5 px-6">288 Schemes</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Online MCQ Test Engine</td>
                <td className="py-3.5 px-6 text-gray-400">—</td>
                <td className="py-3.5 px-6 bg-amber-50/30">✓ Included</td>
                <td className="py-3.5 px-6">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">AI Risk Analytics</td>
                <td className="py-3.5 px-6 text-gray-400">—</td>
                <td className="py-3.5 px-6 bg-amber-50/30">✓ Included</td>
                <td className="py-3.5 px-6">✓ Included</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Multi-Branch Campuses</td>
                <td className="py-3.5 px-6">Single Branch</td>
                <td className="py-3.5 px-6 bg-amber-50/30">Up to 3 Campuses</td>
                <td className="py-3.5 px-6">Unlimited</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">WhatsApp Cloud API Integration</td>
                <td className="py-3.5 px-6">At Meta cost</td>
                <td className="py-3.5 px-6 bg-amber-50/30">At Meta cost</td>
                <td className="py-3.5 px-6 font-medium text-emerald-600">500 free msgs/mo + Meta cost</td>
              </tr>
              <tr>
                <td className="py-3.5 px-6 font-semibold text-[#0F2040]">Support Level</td>
                <td className="py-3.5 px-6">Email Desk</td>
                <td className="py-3.5 px-6 bg-amber-50/30 font-medium text-[#0F2040]">Priority WhatsApp</td>
                <td className="py-3.5 px-6 font-bold text-[#0F2040]">24/7 Dedicated Manager</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Question FAQ Accordion */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center space-y-2 mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-3.5 py-1 text-xs font-bold text-[#0F2040] uppercase tracking-wider">
            <HelpCircle className="w-3.5 h-3.5 text-[#F5B800]" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h2 className="text-3xl font-extrabold text-[#0F2040] tracking-tight">
            Common Questions About Plans
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={faq.question}
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full py-4 px-6 text-left flex items-center justify-between gap-4 font-bold text-base text-[#0F2040] hover:bg-gray-50/80 transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-[#F5B800] shrink-0 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 pt-1 text-sm text-[#4B5563] leading-relaxed border-t border-gray-100 bg-[#FAFAFA]">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-8">
        <div className="rounded-3xl bg-[#FFF9E6] border border-[#F5B800]/40 p-8 sm:p-12 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F2040] tracking-tight">
            Ready to Automate Your School?
          </h2>
          <p className="text-base text-[#4B5563] max-w-xl mx-auto">
            Get instant access to all 12 modules for 14 days. Setup takes less than 5 minutes.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#F5B800] px-8 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99]"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
