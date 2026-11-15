"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F5B800] px-6 py-3.5 text-base font-bold text-[#0F2040] hover:bg-[#DF9E00] shadow-md transition-all active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed min-h-[48px]"
    >
      <span>{pending ? "Signing in..." : "Sign In"}</span>
      {!pending && <ArrowRight className="w-4 h-4" />}
    </button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const registered = searchParams.get("registered") === "true";
  const defaultEmail = searchParams.get("email") || "";
  const [state, formAction] = useFormState(loginAction, null);

  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showForgotNote, setShowForgotNote] = useState(false);

  // Ensure password is unconditionally blank on mount/navigation (Fix: logout password bug)
  useEffect(() => {
    setPassword("");
    if (defaultEmail) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail]);

  return (
    <div className="w-full">
      {/* Eyebrow Badge */}
      <div className="inline-flex items-center gap-2 rounded-full border border-[#F5B800]/40 bg-[#FFF9E6] px-3.5 py-1 text-xs font-bold text-[#0F2040] uppercase tracking-wider mb-4">
        <span className="w-2 h-2 rounded-full bg-[#F5B800]" />
        <span>EduFlow Secure Portal</span>
      </div>

      <h1 className="text-3xl font-extrabold text-[#0F2040] tracking-tight">
        Sign In
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        Enter your school email and password to access your dashboard.
      </p>

      {/* Registration Success Banner */}
      {registered && (
        <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>Your school platform is ready! Sign in below with your admin credentials.</span>
        </div>
      )}

      {/* Error Message */}
      {state?.error && (
        <div className="mt-4 rounded-xl bg-red-50 p-3.5 text-xs font-semibold text-red-700 border border-red-200">
          {state.error}
        </div>
      )}

      <form action={formAction} className="mt-6 space-y-4" autoComplete="off">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. admin@eduflow.test"
              required
              autoComplete="off"
              className="h-11 rounded-xl text-sm border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
            />
          </div>
          {state?.fieldErrors?.email && (
            <p className="text-xs text-red-600 font-medium">
              {state.fieldErrors.email[0]}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowForgotNote(!showForgotNote)}
              className="text-xs font-semibold text-slate-500 hover:text-[#0F2040] hover:underline"
            >
              Forgot password?
            </button>
          </div>
          {showForgotNote && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-blue-900">
              Please contact your school or academy administrator to reset your account password.
            </div>
          )}
          <div className="relative">
            <Input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="new-password"
              className="h-11 rounded-xl text-sm border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
            />
          </div>
          {state?.fieldErrors?.password && (
            <p className="text-xs text-red-600 font-medium">
              {state.fieldErrors.password[0]}
            </p>
          )}
        </div>

        <div className="pt-2">
          <SubmitButton />
        </div>

        <div className="pt-4 text-center">
          <p className="text-xs text-gray-500">
            Don&apos;t have a school account yet?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#0F2040] hover:text-[#F5B800] transition-colors underline"
            >
              Start 14-day free trial →
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}
