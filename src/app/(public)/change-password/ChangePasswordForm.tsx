"use client";

import { useFormState, useFormStatus } from "react-dom";
import { changePasswordAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ShieldAlert, CheckCircle2, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";

function SubmitButton({ isForced = true }: { isForced?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending
        ? "Updating Password..."
        : isForced
        ? "Update Password & Continue"
        : "Save New Password"}
    </Button>
  );
}

interface ChangePasswordFormProps {
  isForced?: boolean;
  dashboardUrl?: string;
}

export function ChangePasswordForm({
  isForced = false,
  dashboardUrl = "/admin",
}: ChangePasswordFormProps) {
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
    <Card className={`w-full max-w-md shadow-lg ${isForced ? "border-amber-200" : "border-slate-200"}`}>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          {isForced ? (
            <Badge variant="outline" className="px-3 py-1 font-semibold text-amber-800 bg-amber-50 border-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 mr-1 text-amber-600 inline" />
              Security Action Required
            </Badge>
          ) : (
            <Badge variant="outline" className="px-3 py-1 font-semibold text-slate-700 bg-slate-50 border-slate-300">
              <Lock className="w-3.5 h-3.5 mr-1 text-slate-600 inline" />
              Account Security
            </Badge>
          )}
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Change Your Password
        </CardTitle>
        <CardDescription className="text-slate-600 text-sm">
          {isForced
            ? "Your account has a default or temporary password. Please set a secure new password to continue."
            : "Update your account password to keep your account secure."}
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800 border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Password updated successfully! Redirecting to your dashboard...</span>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="currentPassword" className="text-sm font-medium text-slate-700">
              Current Password
            </label>
            <Input
              id="currentPassword"
              name="currentPassword"
              type="password"
              placeholder="Enter current password"
              required
              disabled={state?.success}
            />
            {state?.fieldErrors?.currentPassword && (
              <p className="text-xs text-red-600 font-medium">
                {state.fieldErrors.currentPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium text-slate-700">
              New Password (min 8 characters)
            </label>
            <Input
              id="newPassword"
              name="newPassword"
              type="password"
              placeholder="Enter secure new password"
              required
              disabled={state?.success}
            />
            {state?.fieldErrors?.newPassword && (
              <p className="text-xs text-red-600 font-medium">
                {state.fieldErrors.newPassword[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              required
              disabled={state?.success}
            />
            {state?.fieldErrors?.confirmPassword && (
              <p className="text-xs text-red-600 font-medium">
                {state.fieldErrors.confirmPassword[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          {!state?.success && (
            <>
              <SubmitButton isForced={isForced} />
              {!isForced && (
                <Button variant="ghost" size="sm" asChild className="w-full text-slate-600">
                  <Link href={dashboardUrl}>
                    <ArrowLeft className="h-4 w-4 mr-1.5" />
                    Back to Dashboard
                  </Link>
                </Button>
              )}
            </>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
