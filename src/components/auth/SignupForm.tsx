"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupAcademyAction } from "@/lib/actions/signup";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building2, User, Mail, Lock, Phone, Globe, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export function SignupForm() {
  const router = useRouter();
  const [academyName, setAcademyName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPhone, setAdminPhone] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleNameChange = (val: string) => {
    setAcademyName(val);
    // Auto-generate slug from academy name if user hasn't explicitly edited it
    const generated = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    setSlug(generated);
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
        setError(res.error || "Failed to create academy account.");
      }
    });
  };

  return (
    <Card className="w-full max-w-lg shadow-xl border-gray-200/90 rounded-2xl bg-white">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="flex justify-center mb-1">
          <Badge className="bg-[#FFF9E6] text-[#0F2040] border-[#F5B800]/40 px-3 py-1 font-semibold flex items-center space-x-1.5 shadow-none">
            <Sparkles className="h-3.5 w-3.5 text-[#F5B800]" />
            <span>14-Day Free PRO Trial • No Credit Card Required</span>
          </Badge>
        </div>
        <CardTitle className="text-2xl font-bold text-[#0F2040] tracking-tight">
          Create Your School Platform
        </CardTitle>
        <CardDescription className="text-xs text-[#4B5563]">
          Get complete management software for students, teachers, attendance, and fee challans.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* School Info */}
          <div className="space-y-3 pt-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2040] flex items-center">
              <Building2 className="h-3.5 w-3.5 mr-1.5 text-[#F5B800]" />
              School / Academy Information
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="academyName" className="text-xs font-medium text-gray-700">
                School or Academy Name
              </label>
              <Input
                id="academyName"
                placeholder="e.g. Al-Ilm Model School"
                value={academyName}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="slug" className="text-xs font-medium text-gray-700">
                Your Web Address (Subdomain)
              </label>
              <div className="flex items-center">
                <div className="relative flex-1">
                  <Input
                    id="slug"
                    placeholder="al-ilm"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                    required
                    className="h-10 text-xs font-mono pr-2 rounded-l-xl rounded-r-none border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
                  />
                </div>
                <span className="text-xs font-mono font-medium text-[#0F2040] bg-[#FFF9E6] border border-l-0 border-gray-200 h-10 px-3 flex items-center rounded-r-xl">
                  .eduflow.app
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Staff, teachers and parents will access your portal at this link.
              </p>
            </div>
          </div>

          {/* Admin User Info */}
          <div className="space-y-3 pt-3 border-t border-gray-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#0F2040] flex items-center">
              <User className="h-3.5 w-3.5 mr-1.5 text-[#F5B800]" />
              Administrator Credentials
            </h3>

            <div className="space-y-1.5">
              <label htmlFor="adminName" className="text-xs font-medium text-gray-700">
                Full Name
              </label>
              <Input
                id="adminName"
                placeholder="e.g. Professor Ahmad Tariq"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                required
                className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="adminEmail" className="text-xs font-medium text-gray-700">
                  Email Address
                </label>
                <Input
                  id="adminEmail"
                  type="email"
                  placeholder="director@school.edu.pk"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                  className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="adminPhone" className="text-xs font-medium text-gray-700">
                  Phone Number (Optional)
                </label>
                <Input
                  id="adminPhone"
                  placeholder="03001234567"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="adminPassword" className="text-xs font-medium text-gray-700">
                Admin Password
              </label>
              <Input
                id="adminPassword"
                type="password"
                placeholder="At least 8 characters"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                required
                minLength={8}
                className="h-10 text-xs rounded-xl border-gray-200 focus-visible:ring-[#F5B800] focus-visible:border-[#F5B800]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 mt-4 bg-[#F5B800] hover:bg-[#DF9E00] text-[#0F2040] font-bold text-sm rounded-xl shadow-md transition-all active:scale-[0.99] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                <span>Setting up your school portal...</span>
              </>
            ) : (
              <>
                <span>Start 14-Day Free PRO Trial</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>

          <div className="pt-2 text-center text-xs text-gray-500">
            Already have a school account?{" "}
            <Link href="/login" className="text-[#0F2040] hover:text-[#F5B800] font-bold underline transition-colors">
              Sign In
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
