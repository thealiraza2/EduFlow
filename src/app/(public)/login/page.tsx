import type { Metadata } from "next";
import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { LoginForm } from "./LoginForm";
import { DashboardPreview } from "@/components/marketing/DashboardPreview";

export const metadata: Metadata = {
  title: "Login | EduFlow Secure Portal",
  description: "Sign in to your EduFlow school and academy management dashboard.",
};

export default function LoginPage() {
  const checklist = [
    "14-day free trial",
    "No credit card required",
    "Free onboarding & data import",
  ];

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-white">
      {/* Left Column (White): Logo + Centered Login Form + Legal links */}
      <div className="col-span-1 lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 lg:p-12 xl:p-16 bg-white">
        {/* Top Logo */}
        <div>
          <Link href="/" className="inline-flex items-center gap-3 group focus:outline-none">
            <Image
              src="/images/logo.svg"
              alt="EduFlow Logo"
              width={160}
              height={40}
              priority
              className="h-10 w-auto"
            />
            <span className="hidden sm:inline-block border-l border-gray-200 pl-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              School Management System
            </span>
          </Link>
        </div>

        {/* Center: Sign In Form */}
        <div className="py-8 sm:py-12 my-auto w-full max-w-md mx-auto">
          <Suspense fallback={<div className="text-center text-gray-500 py-8 text-sm">Loading sign in...</div>}>
            <LoginForm />
          </Suspense>
        </div>

        {/* Bottom: Legal / Copyright */}
        <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <span>© 2026 EduFlow. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-gray-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </div>

      {/* Right Column (Solid YELLOW): Heading + Checklist + Dashboard Mockup (NO testimonials) */}
      <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 bg-[#F5B800] p-8 lg:p-12 xl:p-16 flex-col justify-center items-center text-[#0F2040] relative overflow-hidden">
        {/* Background Subtle Accents */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-black/5 blur-2xl pointer-events-none" />

        <div className="w-full max-w-lg space-y-8 relative z-10">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0F2040]/10 px-4 py-1.5 text-xs font-extrabold text-[#0F2040] uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#0F2040]" />
            <span>ALL-IN-ONE SCHOOL PLATFORM</span>
          </div>

          {/* Heading */}
          <h2 className="text-3xl xl:text-4xl font-extrabold text-[#0F2040] tracking-tight leading-tight">
            Complete School Management, Simplified.
          </h2>

          {/* Checklist */}
          <div className="space-y-3">
            {checklist.map((item) => (
              <div key={item} className="flex items-center gap-3 text-base font-bold text-[#0F2040]">
                <div className="w-6 h-6 rounded-full bg-white text-[#0F2040] flex items-center justify-center shadow-sm shrink-0">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <span>{item}</span>
              </div>
            ))}
          </div>

          {/* Real JSX Dashboard Mockup (Clean JSX with demo stats, NO testimonials) */}
          <div className="pt-2">
            <div className="shadow-2xl rounded-2xl overflow-hidden border border-[#0F2040]/10">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
