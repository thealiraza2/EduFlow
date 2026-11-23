"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CircleAlert, Loader2 } from "lucide-react";
import { createAcademyAction } from "@/lib/actions/superadmin";
import { ConsoleSection, TempPasswordNotice, fieldClass, primaryBtn, secondaryBtn } from "./ConsoleUI";

type Created = { academyId: string; adminEmail: string; tempPassword: string };

export function CreateAcademyForm() {
  const [form, setForm] = useState({
    academyName: "",
    slug: "",
    adminName: "",
    adminEmail: "",
    adminPhone: "",
    plan: "PRO",
    trialDays: "14",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [pending, start] = useTransition();

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const onName = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setForm((f) => ({
      ...f,
      academyName: v,
      slug: slugEdited
        ? f.slug
        : v.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30),
    }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await createAcademyAction({
        ...form,
        plan: form.plan as "FREE" | "STARTER" | "GROWTH" | "PRO",
        trialDays: Number(form.trialDays),
      });
      if (res.success) setCreated({ academyId: res.academyId, adminEmail: res.adminEmail, tempPassword: res.tempPassword });
      else setError(res.error);
    });
  };

  if (created) {
    return (
      <div className="space-y-4">
        <TempPasswordNotice email={created.adminEmail} password={created.tempPassword} />
        <div className="flex flex-wrap gap-2">
          <Link href={`/superadmin/academies/${created.academyId}`} className={primaryBtn}>
            Open academy settings
          </Link>
          <Link href="/superadmin" className={secondaryBtn}>
            Back to all academies
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-status-danger-bg p-3.5 text-[14px] text-status-danger">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <ConsoleSection title="School" description="The academy's name and the web address its staff and parents will use.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">School or academy name</span>
            <input className={fieldClass} value={form.academyName} onChange={onName} required placeholder="e.g. Al-Ilm Model School" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Web address</span>
            <div className="flex">
              <input
                className={fieldClass + " rounded-r-none font-mono text-[14px]"}
                value={form.slug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setForm((f) => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") }));
                }}
                required
                placeholder="al-ilm"
              />
              <span className="inline-flex h-10 shrink-0 items-center rounded-r-md border border-l-0 border-line-strong bg-surface-sunken px-3 font-mono text-[13px] text-ink-2">
                .eduflow.app
              </span>
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Plan</span>
            <select className={fieldClass} value={form.plan} onChange={set("plan")}>
              <option value="STARTER">Starter — PKR 2,500 / month</option>
              <option value="GROWTH">Growth — PKR 5,000 / month</option>
              <option value="PRO">Pro — PKR 9,000 / month</option>
              <option value="FREE">Free</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Free trial</span>
            <select className={fieldClass} value={form.trialDays} onChange={set("trialDays")}>
              <option value="0">No trial — billing starts now</option>
              <option value="7">7 days</option>
              <option value="14">14 days</option>
              <option value="30">30 days</option>
              <option value="60">60 days</option>
            </select>
          </label>
        </div>
      </ConsoleSection>

      <ConsoleSection title="First admin" description="We'll create their login with a temporary password you can share.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Full name</span>
            <input className={fieldClass} value={form.adminName} onChange={set("adminName")} required placeholder="e.g. Ahmad Tariq" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">Email</span>
            <input className={fieldClass} type="email" value={form.adminEmail} onChange={set("adminEmail")} required placeholder="principal@school.edu.pk" />
          </label>
          <label className="block space-y-1.5">
            <span className="text-[14px] font-medium text-ink">
              Phone <span className="font-normal text-ink-3">(optional)</span>
            </span>
            <input className={fieldClass} type="tel" value={form.adminPhone} onChange={set("adminPhone")} placeholder="0300 1234567" />
          </label>
        </div>
      </ConsoleSection>

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={pending} className={primaryBtn}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Creating academy…" : "Create academy"}
        </button>
        <Link href="/superadmin" className={secondaryBtn}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
