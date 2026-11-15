import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up | EduFlow — 14-Day Free Trial",
  description: "Create your EduFlow school and academy management platform. Start your 14-day free trial.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#FFF9E6]/30 flex flex-col justify-between">
      {/* Header Navigation */}
      <Header />

      <main className="flex-1 flex flex-col justify-center py-10 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-3 focus:outline-none">
            <Image
              src="/images/logo.svg"
              alt="EduFlow Logo"
              width={180}
              height={45}
              priority
              className="h-11 w-auto mx-auto"
            />
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-[#0F2040]">
            Start Your 14-Day Free Trial
          </h1>
          <p className="mt-1 text-sm text-[#4B5563]">
            No credit card required. Full access to all 12 modules.
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
          <SignupForm />
        </div>
      </main>

      <Footer />
    </div>
  );
}
