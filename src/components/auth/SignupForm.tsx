"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert, Loader2 } from "@/components/icons";
import { signupAcademyAction } from "@/lib/actions/signup";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/auth/AuthShell";

export function SignupForm() {
  const router = useRouter();
  const [academyName, setAcademyName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (val: string) => {
    setAcademyName(val);
    if (slugEdited) return;
    setSlug(
      val
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await signupAcademyAction({
        academyName,
        slug,
        adminName,
        adminEmail,
        adminPassword,
        adminPhone: adminPhone || undefined,
      });
      if (res.success) {
        router.push(`/login?registered=true&email=${encodeURIComponent(res.adminEmail!)}`);
      } else {
        setError(res.error || "We couldn't create your academy. Please try again.");
      }
    });
  };

  return (
    <div className="w-full animate-rise-in">
      <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-3">
        14-Day Free PRO Trial • No Credit Card Required
      </p>
      <h1 className="mt-3 font-serif text-[34px] leading-tight text-ink">Create Your School Platform</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        Every Pro feature for 14 days: students, attendance, fee challans, results and parent portal.
      </p>

      {error && (
        <div role="alert" className="mt-6 flex items-start gap-2.5 rounded-md bg-status-danger-bg p-3.5 text-[14px] text-status-danger">
          <CircleAlert className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-8">
        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">Your school</legend>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="academyName">School or academy name</FieldLabel>
            <Input
              id="academyName"
              placeholder="e.g. Al-Ilm Model School"
              value={academyName}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              autoComplete="organization"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="slug">Web address</FieldLabel>
            <div className="flex rounded-md shadow-1 focus-within:ring-2 focus-within:ring-primary/25">
              <Input
                id="slug"
                placeholder="al-ilm"
                value={slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""));
                }}
                required
                className="rounded-r-none font-mono text-[14px] shadow-none focus-visible:ring-0"
              />
              <span className="inline-flex h-10 shrink-0 items-center rounded-r-md border border-l-0 border-line-strong bg-surface-sunken px-3 font-mono text-[14px] text-ink-2">
                .eduflow.app
              </span>
            </div>
            <p className="text-small text-ink-3">Staff, teachers and parents open your portal at this address.</p>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">Admin account</legend>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="adminName">Full name</FieldLabel>
            <Input
              id="adminName"
              placeholder="e.g. Ahmad Tariq"
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="adminEmail">Email</FieldLabel>
              <Input
                id="adminEmail"
                type="email"
                inputMode="email"
                placeholder="principal@school.edu.pk"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="adminPhone">
                Phone <span className="font-normal text-ink-3">(optional)</span>
              </FieldLabel>
              <Input
                id="adminPhone"
                type="tel"
                inputMode="tel"
                placeholder="0300 1234567"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                autoComplete="tel"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="adminPassword">Password</FieldLabel>
            <Input
              id="adminPassword"
              type="password"
              placeholder="At least 8 characters"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>
        </fieldset>

        <button
          type="submit"
          disabled={isPending}
          className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-medium text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-80"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Creating your academy…" : "Create academy & start trial"}
        </button>
      </form>

      <p className="mt-8 border-t border-line pt-6 text-[14px] text-ink-2">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </div>
  );
}
