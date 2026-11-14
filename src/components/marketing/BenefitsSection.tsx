import { Shield, Cloud, Smartphone, Headphones, Sliders, DollarSign } from "lucide-react";

export function BenefitsSection() {
  const benefits = [
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Bank-grade data encryption with strictly isolated school tenant boundaries.",
    },
    {
      icon: Cloud,
      title: "Cloud Based",
      description: "Always accessible from any web browser without local server installations.",
    },
    {
      icon: Smartphone,
      title: "Easy to Use",
      description: "Clean, intuitive interface designed for teachers, principals, and administrative staff.",
    },
    {
      icon: Headphones,
      title: "Dedicated Support",
      description: "Fast onboarding, guided training, and continuous assistance for your faculty.",
    },
    {
      icon: Sliders,
      title: "Fully Customizable",
      description: "Tailored class structures, grading schemes, and batch-wise fee schedules.",
    },
    {
      icon: DollarSign,
      title: "Affordable Pricing",
      description: "Transparent subscription plans starting from PKR 2,500 with zero hidden fees.",
    },
  ];

  return (
    <section className="py-20 md:py-28 bg-[#FFF9E6]/70 border-t border-amber-100/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16 sm:mb-20 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-white px-4 py-1.5 text-xs font-bold text-[#0F2040] uppercase tracking-wider shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
            <span>WHY CHOOSE US</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F2040] tracking-tight">
            Built for <span className="text-[#F5B800]">Modern Schools</span>
          </h2>

          <p className="text-base sm:text-lg text-[#4B5563] leading-relaxed max-w-2xl mx-auto">
            Everything you need to manage your school efficiently, safely and with confidence.
          </p>
        </div>

        {/* 6 Benefit Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="rounded-2xl border border-amber-100 bg-white p-7 shadow-sm hover:shadow-md hover:border-[#F5B800]/40 transition-all duration-200"
              >
                <div className="w-12 h-12 rounded-xl bg-[#FFF9E6] border border-[#F5B800]/30 flex items-center justify-center text-[#F5B800] mb-5">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                </div>
                <h3 className="text-lg font-bold text-[#0F2040]">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm text-[#4B5563] leading-relaxed">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
