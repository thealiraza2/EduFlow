"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CircleAlert, CircleCheck, Loader2, ShieldAlert } from "@/components/icons";
import { changePasswordAction } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { FieldError, FieldLabel } from "@/components/auth/AuthShell";

function SubmitButton({ isForced = true }: { isForced?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary text-[15px] font-medium text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus disabled:cursor-not-allowed disabled:opacity-80"
    >
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Updating password…" : isForced ? "Update password & continue" : "Save new password"}
    </button>
  );
}

interface ChangePasswordFormProps {
  isForced?: boolean;
  dashboardUrl?: string;
}

export function ChangePasswordForm({ isForced = false, dashboardUrl = "/admin" }: ChangePasswordFormProps) {
  const router = useRouter();
  const [state, formAction] = useFormState(changePasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      const destination = state.redirectTo || dashboardUrl;
      const timer = setTimeout(() => {
        router.push(destination);
        router.refresh();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [state?.success, state?.redirectTo, dashboardUrl, router]);

  return (
    <div className="w-full max-w-[440px] animate-rise-in">
      {isForced ? (
        <p className="inline-flex items-center gap-1.5 rounded-sm bg-status-warning-bg px-2 py-1 text-[12px] font-semibold text-status-warning">
          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
          Action needed before you continue
        </p>
      ) : (
        <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-ink-3">Account security</p>
      )}
      <h1 className="mt-3 font-serif text-[34px] leading-tight text-ink">Change Your Password</h1>
      <p className="mt-2 text-[15px] text-ink-2">
        {isForced
          ? "Your account still has a temporary password. Choose a new one that only you know."
          : "Use at least 8 characters. You'll stay signed in on this device."}
      </p>

      <form action={formAction} className="mt-8 space-y-5">
        {state?.error && (
          <div role="alert" className="flex items-start gap-2.5 rounded-md bg-status-danger-bg p-3.5 text-[14px] text-status-danger">
            <CircleAlert className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>{state.error}</span>
          </div>
        )}
        {state?.success && (
          <div role="status" className="flex items-start gap-2.5 rounded-md bg-status-success-bg p-3.5 text-[14px] text-status-success">
            <CircleCheck className="mt-0.5 h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
            <span>Password updated. Taking you to your dashboard…</span>
          </div>
        )}

        <div className="space-y-1.5">
          <FieldLabel htmlFor="currentPassword">Current password</FieldLabel>
          <Input id="currentPassword" name="currentPassword" type="password" autoComplete="current-password" required disabled={state?.success} />
          <FieldError>{state?.fieldErrors?.currentPassword?.[0]}</FieldError>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="newPassword">New password</FieldLabel>
          <Input id="newPassword" name="newPassword" type="password" autoComplete="new-password" placeholder="At least 8 characters" required disabled={state?.success} />
          <FieldError>{state?.fieldErrors?.newPassword?.[0]}</FieldError>
        </div>
        <div className="space-y-1.5">
          <FieldLabel htmlFor="confirmPassword">Confirm new password</FieldLabel>
          <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required disabled={state?.success} />
          <FieldError>{state?.fieldErrors?.confirmPassword?.[0]}</FieldError>
        </div>

        {!state?.success && (
          <div className="space-y-3 pt-1">
            <SubmitButton isForced={isForced} />
            {!isForced && (
              <Link
                href={dashboardUrl}
                className="press inline-flex h-11 w-full items-center justify-center rounded-md text-[15px] font-medium text-ink-2 hover:bg-surface-sunken hover:text-ink"
              >
                Back to dashboard
              </Link>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
