"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, KeyRound } from "lucide-react";

export function ConsolePageHeader({
  title,
  description,
  back,
  actions,
}: {
  title: string;
  description?: React.ReactNode;
  back?: { href: string; label: string };
  actions?: React.ReactNode;
}) {
  return (
    <div className="border-b border-line bg-surface px-4 py-5 sm:px-8">
      {back && (
        <Link href={back.href} className="mb-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" />
          {back.label}
        </Link>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-serif text-[30px] leading-tight text-ink">{title}</h1>
          {description && <p className="mt-1 text-[14px] text-ink-2">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function ConsoleSection({
  title,
  description,
  children,
  tone = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={
        "rounded-2xl border bg-surface p-5 shadow-1 sm:p-6 " +
        (tone === "danger" ? "border-status-danger/30" : "border-line")
      }
    >
      <h2 className={"text-[17px] font-bold " + (tone === "danger" ? "text-status-danger" : "text-ink")}>{title}</h2>
      {description && <p className="mt-1 text-[14px] text-ink-2">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Shows a freshly generated temporary password once, with a copy button. */
export function TempPasswordNotice({ email, password, onDone }: { email: string; password: string; onDone?: () => void }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`Email: ${email}\nTemporary password: ${password}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the user can still select the text */
    }
  };
  return (
    <div role="status" className="rounded-xl border border-status-success/30 bg-status-success-bg p-4">
      <p className="flex items-center gap-2 text-[14px] font-semibold text-status-success">
        <KeyRound className="h-4 w-4" /> Temporary password created — share it with the admin now
      </p>
      <dl className="mt-3 grid gap-1 text-[14px] sm:grid-cols-[150px_1fr]">
        <dt className="text-ink-2">Email</dt>
        <dd className="break-all font-medium text-ink">{email}</dd>
        <dt className="text-ink-2">Temporary password</dt>
        <dd className="select-all break-all font-mono text-[15px] font-medium text-ink">{password}</dd>
      </dl>
      <p className="mt-2 text-[13px] text-ink-2">
        It is shown only once. They will be asked to choose their own password on first login.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary-hover"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy login details"}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="inline-flex h-9 items-center rounded-full border border-line-strong bg-surface px-4 text-[13px] font-semibold text-ink hover:bg-surface-sunken"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

export const fieldClass =
  "h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink shadow-1 placeholder:text-ink-3 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export const primaryBtn =
  "press inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60";

export const secondaryBtn =
  "press inline-flex h-10 items-center justify-center gap-2 rounded-full border border-line-strong bg-surface px-5 text-[14px] font-semibold text-ink hover:bg-surface-sunken disabled:opacity-60";
