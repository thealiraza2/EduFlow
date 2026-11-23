import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Log in | EduFlow",
  description: "Sign in to your EduFlow school and academy dashboard.",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p className="py-8 text-center text-small text-ink-3">Loading sign in…</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
