"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Play } from "lucide-react";
import { HeroDashboardMock } from "./HeroDashboardMock";

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion();

  const headlineWords = ["Poora", "academy,", "ek", "hi", "jagah."];

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const targetId = href.substring(1);
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: "smooth" });
      window.history.pushState(null, "", href);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.08,
      },
    },
  };

  const wordVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 12 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: shouldReduceMotion ? 0 : 0.4 },
    },
  };

  return (
    <section className="relative overflow-hidden pt-8 pb-16 sm:pt-12 sm:pb-20 lg:pt-16 lg:pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Headline, subhead, CTAs */}
          <div className="lg:col-span-6 space-y-6 sm:space-y-7">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-pine" />
              <span>For Academies & Schools in Pakistan</span>
            </div>

            {/* H1 (serif) */}
            <motion.h1
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-ink leading-[1.12]"
            >
              {headlineWords.map((word, index) => (
                <motion.span
                  key={`${word}-${index}`}
                  variants={wordVariants}
                  className={`inline-block mr-2.5 sm:mr-3 ${
                    word === "jagah." ? "text-pine" : ""
                  }`}
                >
                  {word}
                </motion.span>
              ))}
            </motion.h1>

            {/* Subhead */}
            <p className="text-lg sm:text-xl text-[#42413C] leading-relaxed max-w-xl font-sans">
              Attendance, fees, tests, results aur parents — sab kuch ek dashboard mein.
            </p>

            {/* Action CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-1">
              <a
                href="#trial"
                onClick={(e) => handleScrollTo(e, "#trial")}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-pine px-6 py-3.5 text-base font-semibold text-white shadow-sm hover:bg-pine-hover active:scale-[0.99] transition-all cursor-pointer min-h-[48px]"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </a>

              <a
                href="#features"
                onClick={(e) => handleScrollTo(e, "#features")}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#D5CEC2] bg-white px-6 py-3.5 text-base font-medium text-ink hover:bg-[#F3EFE7] active:scale-[0.99] transition-all cursor-pointer min-h-[48px]"
              >
                <Play className="w-4 h-4 text-pine fill-pine/20" />
                <span>See how it works</span>
              </a>
            </div>

            {/* Micro reassurance trust items */}
            <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-[#5E5C55]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pine stroke-[2.5]" />
                <span>14-day free trial</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pine stroke-[2.5]" />
                <span>No credit card required</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-pine stroke-[2.5]" />
                <span>JazzCash & Easypaisa ready</span>
              </span>
            </div>
          </div>

          {/* Right Column: Real classroom photo + floating dashboard mock */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl overflow-hidden border border-[#DCD5C8] shadow-xl bg-[#EBE5D9] min-h-[420px] sm:min-h-[500px] flex items-center justify-center p-3 sm:p-6 lg:p-7">
              {/* Background authentic classroom photo with 20s slow zoom */}
              <div className="absolute inset-0 overflow-hidden">
                <Image
                  src="/images/hero-classroom.jpg"
                  alt="Pakistani classroom with teacher and student"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 600px"
                  className="object-cover photo-warm animate-hero-zoom select-none"
                />
                {/* Contrast overlay so the floating dashboard mock is always readable */}
                <div className="absolute inset-0 bg-black/25 sm:bg-black/20 backdrop-brightness-95" />
              </div>

              {/* Floating Real JSX Dashboard Mock */}
              <div className="relative z-10 w-full flex justify-center">
                <HeroDashboardMock />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
