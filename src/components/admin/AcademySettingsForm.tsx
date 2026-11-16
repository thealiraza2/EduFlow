"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateAcademySettingsAction, UpdateSettingsState } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, CheckCircle2, ShieldCheck, Calendar, Phone } from "lucide-react";

interface AcademySettingsFormProps {
  initialData: {
    name: string;
    slug: string;
    subdomain: string | null;
    plan: string;
    status: string;
    phone: string | null;
    academicYear: string;
    adminEmail: string;
    createdAt: string;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="bg-slate-900 text-white hover:bg-slate-800">
      {pending ? "Saving Settings..." : "Save Academy Settings"}
    </Button>
  );
}

export function AcademySettingsForm({ initialData }: AcademySettingsFormProps) {
  const [state, formAction] = useFormState<UpdateSettingsState | null, FormData>(
    updateAcademySettingsAction,
    null
  );

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold text-slate-900 flex items-center">
              <Building2 className="h-5 w-5 mr-2 text-indigo-600" />
              General Academy Information
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              Manage your institution name, contact details, and current academic calendar.
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs font-mono bg-slate-50">
              Slug: {initialData.slug}
            </Badge>
            <Badge
              className={
                initialData.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                  : "bg-rose-100 text-rose-800 border-rose-300"
              }
            >
              {initialData.status}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-5">
          {state?.error && (
            <div className="rounded-md bg-red-50 p-3 text-sm font-medium text-red-700 border border-red-200">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="rounded-md bg-emerald-50 p-3 text-sm font-medium text-emerald-800 border border-emerald-200 flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Academy settings saved successfully.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-slate-700">
                Academy Name *
              </label>
              <Input
                id="name"
                name="name"
                defaultValue={initialData.name}
                required
                placeholder="e.g. Apex Academy"
              />
              {state?.fieldErrors?.name && (
                <p className="text-xs text-red-600">{state.fieldErrors.name[0]}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-slate-700 flex items-center">
                <Phone className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Contact Phone Number
              </label>
              <Input
                id="phone"
                name="phone"
                defaultValue={initialData.phone || ""}
                placeholder="e.g. +92 300 1234567"
              />
              {state?.fieldErrors?.phone && (
                <p className="text-xs text-red-600">{state.fieldErrors.phone[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="academicYear" className="text-sm font-medium text-slate-700 flex items-center">
                <Calendar className="h-3.5 w-3.5 mr-1 text-slate-400" />
                Current Academic Year
              </label>
              <Input
                id="academicYear"
                name="academicYear"
                defaultValue={initialData.academicYear}
                placeholder="e.g. 2026-2027"
              />
              <p className="text-[11px] text-slate-500">
                Active academic cycle used across student enrollments and fee schedules.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Subdomain & URL
              </label>
              <Input
                disabled
                value={`${initialData.slug}.eduflow.app`}
                className="bg-slate-50 text-slate-500 font-mono text-xs"
              />
              <p className="text-[11px] text-slate-500">
                Domain slug is managed by platform administrators.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-700">Platform Subscription Plan:</span>
                <Badge className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {initialData.plan}
                </Badge>
              </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Account Administrator:</span>
              <span className="font-medium text-slate-700">{initialData.adminEmail}</span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Tenant Creation Date:</span>
              <span>{initialData.createdAt}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-2 border-t bg-slate-50/50">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
