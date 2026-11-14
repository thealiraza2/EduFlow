import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link href="/" className="inline-flex items-center space-x-2">
          <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-md">
            <GraduationCap className="h-6 w-6" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">AcademyHub</span>
        </Link>
        <p className="mt-2 text-xs text-slate-600">
          The all-in-one management platform for coaching academies in Pakistan
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <SignupForm />
      </div>
    </div>
  );
}
