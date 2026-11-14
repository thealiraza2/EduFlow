"use client";

import { motion, useReducedMotion } from "framer-motion";
import { UserPlus, School, Sparkles } from "lucide-react";

export function HowItWorks() {
  const shouldReduceMotion = useReducedMotion();

  const steps = [
    {
      step: "01",
      icon: UserPlus,
      title: "Sign up — 14 din free",
      description:
        "Apni academy ka naam aur contact dein. Do minute mein aapka dedicated tenant live ho jata hai — kisi credit card ki zaroorat nahi.",
      detail: "14-day full access • Instant setup",
    },
    {
      step: "02",
      icon: School,
      title: "Add students, teachers, classes",
      description:
        "Classes, subjects aur fee schedules set karein. Teachers ko unke batches assign karein aur students ko roll numbers ke sath enroll karein.",
      detail: "Batch-wise fee plans • Class sections",
    },
    {
      step: "03",
      icon: Sparkles,
      title: "Attendance, fees aur results — sab automatic",
      description:
        "QR attendance se proxy khatam, JazzCash/Easypaisa webhook se fee status auto-PAID, aur WhatsApp se parents har waqt updated.",
      detail: "Zero manual ledger entry • Instant parent SMS",
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 25 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.5 },
    },
  };

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#F5F1E9] border-t border-[#E8E2D6] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#EAE4D7] px-3.5 py-1 text-xs font-semibold text-ink mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-pine" />
            <span>Asaan Workflow</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
            Teen asaan steps mein shuru karein
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#55534D] font-sans">
            Complex training ya manual file keeping ki zaroorat nahi. Aapki academy pehle din se digital.
          </p>
        </div>

        {/* Steps Grid with Connecting Line */}
        <div className="relative">
          {/* Connecting line on desktop */}
          <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-[2px] bg-[#DDD6C8] z-0" />

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 relative z-10"
          >
            {steps.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.step}
                  variants={itemVariants}
                  className="rounded-2xl border border-[#DDD6C8] bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm relative"
                >
                  <div className="space-y-5">
                    {/* Step number badge & Icon */}
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-pine text-white flex items-center justify-center font-display font-bold text-lg shadow-sm">
                        {s.step}
                      </div>
                      <div className="w-10 h-10 rounded-lg bg-[#F5F1E9] border border-[#DDD6C8] flex items-center justify-center text-pine">
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h3 className="font-display text-xl font-bold text-ink leading-snug">
                        {s.title}
                      </h3>
                      <p className="text-sm text-[#55534D] leading-relaxed font-sans">
                        {s.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[#EAE4D8] text-xs font-semibold text-pine">
                    {s.detail}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
