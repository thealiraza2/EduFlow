import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Sign Up | EduFlow — 14-Day Free Trial",
  description: "Create your EduFlow school and academy management platform. Start your 14-day free trial.",
};

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-[#FFF9E6]/30 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header Logo & Subtitle */}
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
        <p className="mt-3 text-sm font-medium text-[#4B5563]">
          Streamline your school operations with an all-in-one platform.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <SignupForm />
      </div>

      {/* Footer Links */}
      <div className="mt-8 text-center text-xs text-gray-500 space-x-4">
        <Link href="/" className="hover:text-[#0F2040] transition-colors">
          Home
        </Link>
        <span>•</span>
        <Link href="/privacy" className="hover:text-[#0F2040] transition-colors">
          Privacy Policy
        </Link>
        <span>•</span>
        <Link href="/terms" className="hover:text-[#0F2040] transition-colors">
          Terms of Service
        </Link>
        <span>•</span>
        <Link href="/login" className="hover:text-[#0F2040] transition-colors font-semibold">
          Login
        </Link>
      </div>
    </div>
  );
}
