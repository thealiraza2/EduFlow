"use client";

import { useFormState, useFormStatus } from "react-dom";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Signing in..." : "Sign In"}
    </Button>
  );
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "";
  const [state, formAction] = useFormState(loginAction, null);

  return (
    <Card className="w-full max-w-md shadow-lg border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-2">
          <Badge variant="outline" className="px-3 py-1 font-semibold text-slate-700">
            AcademyHub Secure Portal
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
          Sign In
        </CardTitle>
        <CardDescription className="text-slate-500">
          Enter your academy email and password
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200">
              {state.error}
            </div>
          )}

          <input type="hidden" name="callbackUrl" value={callbackUrl} />

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email Address
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="e.g. admin@academyhub.test"
              required
              autoComplete="email"
            />
            {state?.fieldErrors?.email && (
              <p className="text-xs text-red-600 font-medium">
                {state.fieldErrors.email[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
            {state?.fieldErrors?.password && (
              <p className="text-xs text-red-600 font-medium">
                {state.fieldErrors.password[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <SubmitButton />
          <p className="text-xs text-center text-slate-500">
            Academy accounts are issued directly by the administration. Self-registration is disabled.
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
