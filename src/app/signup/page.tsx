import type { Metadata } from "next";
import { SignupForm } from "@/components/auth/SignupForm";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = {
  title: "Start free trial | EduFlow",
  description: "Create your EduFlow school or academy workspace. 14-day free trial, no card needed.",
};

export default function SignupPage() {
  return (
    <AuthShell photoCaption="Set up classes, admit students and mark tomorrow's attendance — today.">
      <SignupForm />
    </AuthShell>
  );
}
