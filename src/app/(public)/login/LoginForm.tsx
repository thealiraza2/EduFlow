"use client";

import { useState, useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CircleCheck, CircleAlert, Eye, EyeOff, Loader2 } from "@/components/icons";
import { FieldError, FieldLabel } from "@/components/auth/AuthShell";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-medium text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-80"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Signing in…" : "Sign In"}
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
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotNote, setShowForgotNote] = useState(false);

  // Password is always blank on mount/navigation (fix: logout password bug)
  useEffect(() => {
    setPassword("");
    if (defaultEmail) setEmail(defaultEmail);
  }, [defaultEmail]);

  return (
    <div className="w-full animate-rise-in">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-3">EduFlow secure portal</p>
      <h1 className="mt-3 font-serif text-[34px] leading-tight text-ink">Sign In</h1>
      <p className="mt-2 text-[15px] text-ink-2">Use the email and password your school gave you.</p>

      {registered && (
        <div role="status" className="mt-6 flex items-start gap-2.5 rounded-md bg-status-success-bg p-3.5 text-[14px] text-status-success">
          <CircleCheck className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span>Your academy is ready. Sign in with the admin email and password you just created.</span>
        </div>
      )}

      {state?.error && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-md bg-status-danger-bg p-3.5 text-[14px] text-status-danger">
          <CircleAlert className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span>{state.error}</span>
        </div>
      )}

      <form action={formAction} className="mt-8 space-y-5" autoComplete="off">
        <input type="hidden" name="callbackUrl" value={callbackUrl} />

        <div className="space-y-1.5">
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@yourschool.com"
            required
            autoComplete="username"
            aria-invalid={!!state?.fieldErrors?.email}
            className="h-11"
          />
          <FieldError>{state?.fieldErrors?.email?.[0]}</FieldError>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <button
              type="button"
              onClick={() => setShowForgotNote((v) => !v)}
              aria-expanded={showForgotNote}
              className="rounded-sm text-small font-medium text-primary hover:underline focus-visible:outline-none focus-visible:shadow-focus"
            >
              Forgot password?
            </button>
          </div>
          {showForgotNote && (
            <p className="rounded-md bg-status-info-bg p-3 text-small text-status-info">
              Ask your school or academy administrator to reset it. They can set a new password from Settings.
            </p>
          )}
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-invalid={!!state?.fieldErrors?.password}
              className="h-11 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-1 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-ink-3 hover:bg-surface-sunken hover:text-ink focus-visible:outline-none focus-visible:shadow-focus"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} /> : <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />}
            </button>
          </div>
          <FieldError>{state?.fieldErrors?.password?.[0]}</FieldError>
        </div>

        <SubmitButton />
      </form>

      <p className="mt-8 border-t border-line pt-6 text-[14px] text-ink-2">
        Running a school or academy?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Start a 14-day free trial
        </Link>
      </p>
    </div>
  );
}
