"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { z } from "zod";
import { signupAcademyAction } from "@/lib/actions/signup";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, Building, User, Mail, Phone, Lock } from "lucide-react";

// Client-side Zod validation with Pakistani phone format
const pakistaniPhoneRegex = /^(?:\+92|0)?3[0-9]{2}[- ]?[0-9]{7}$/;

const trialFormSchema = z.object({
  name: z.string().trim().min(2, "Apna naam darj karein (kam az kam 2 characters)"),
  academyName: z.string().trim().min(3, "Academy ya school ka naam kam az kam 3 characters hona chahiye"),
  phone: z
    .string()
    .trim()
    .regex(pakistaniPhoneRegex, "Sahi Pakistani mobile number darj karein (maslan 03001234567 ya +923001234567)"),
  email: z.string().trim().toLowerCase().email("Durust email address darj karein"),
  password: z.string().optional(),
});

export function TrialSignupForm() {
  const [name, setName] = useState("");
  const [academyName, setAcademyName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    academyName: string;
    slug: string;
    email: string;
  } | null>(null);

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);
    setFieldErrors({});

    // 1. Client-side Zod validation
    const validation = trialFormSchema.safeParse({
      name,
      academyName,
      phone,
      email,
      password: password || undefined,
    });

    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          errMap[err.path[0].toString()] = err.message;
        }
      });
      setFieldErrors(errMap);
      return;
    }

    // 2. Derive a clean alphanumeric slug from academyName
    const baseSlug = academyName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 24)
      .replace(/^-+|-+$/g, "");
    
    // Ensure slug is clean and unique
    const slug = (baseSlug.length >= 3 ? baseSlug : "academy") + `-${Math.floor(100 + Math.random() * 900)}`;

    const effectivePassword = password && password.length >= 8 ? password : "TrialPassword123!";

    // 3. Call existing Phase 10 academy signup server action
    startTransition(async () => {
      try {
        const res = await signupAcademyAction({
          academyName: validation.data.academyName,
          slug,
          adminName: validation.data.name,
          adminEmail: validation.data.email,
          adminPassword: effectivePassword,
          adminPhone: validation.data.phone.replace(/[- ]/g, ""),
        });

        if (res.success) {
          setSuccessData({
            academyName: validation.data.academyName,
            slug: res.slug || slug,
            email: res.adminEmail || validation.data.email,
          });
        } else {
          setServerError(res.error || "Academy setup nahi ho saki. Baraye meherbani dobara koshish karein.");
        }
      } catch (err: any) {
        setServerError(err?.message || "Server se rabta nahi ho saka. Baraye meherbani dobara check karein.");
      }
    });
  };

  // SUCCESS STATE
  if (successData) {
    return (
      <div className="rounded-2xl border-2 border-emerald-500 bg-white p-7 sm:p-10 shadow-xl text-center space-y-6 max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.2]" />
        </div>

        <div className="space-y-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            14-Day Free PRO Trial Active
          </span>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-ink">
            Trial ban gaya — login karein!
          </h3>
          <p className="text-sm text-[#55534D] leading-relaxed">
            Aapki academy <strong className="text-ink">{successData.academyName}</strong> ka dedicated portal tayyar hai.
          </p>
        </div>

        <div className="rounded-xl bg-[#FAF7F2] border border-[#E6E0D4] p-4 text-xs text-left space-y-2 text-[#4A4843]">
          <div className="flex justify-between">
            <span className="text-[#6B6B64]">Academy Subdomain:</span>
            <span className="font-mono font-semibold text-ink">{successData.slug}.academyhub.app</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6B64]">Admin Email:</span>
            <span className="font-mono font-semibold text-ink">{successData.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6B6B64]">Trial Duration:</span>
            <span className="font-semibold text-pine">14 Days Full Access</span>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href={`/login?email=${encodeURIComponent(successData.email)}`}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-pine px-6 py-4 text-base font-bold text-white shadow-md hover:bg-pine-hover active:scale-[0.99] transition-all"
          >
            <span>Login Karein</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    );
  }

  // DEFAULT FORM STATE
  return (
    <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-9 shadow-lg max-w-lg mx-auto text-left">
      <div className="space-y-1.5 pb-6 border-b border-[#EDE6DB]">
        <h3 className="font-display text-2xl font-bold text-ink">
          14-Day Free Trial Shuru Karein
        </h3>
        <p className="text-xs sm:text-sm text-[#55534D]">
          Koi credit card required nahi. Setup do minute mein mukammal hota hai.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 pt-6" noValidate>
        {serverError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="leading-tight">{serverError}</span>
          </div>
        )}

        {/* Your Name */}
        <div className="space-y-1.5">
          <label htmlFor="trial-name" className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-pine" />
            <span>Aapka Naam (Administrator)</span>
          </label>
          <input
            id="trial-name"
            name="name"
            type="text"
            required
            disabled={isPending}
            placeholder="e.g. Professor Ahmad Raza"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all ${
              fieldErrors.name ? "border-red-400 bg-red-50/30" : "border-[#DDD6C8]"
            }`}
          />
          {fieldErrors.name && (
            <p className="text-[11px] text-red-600 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Academy / School Name */}
        <div className="space-y-1.5">
          <label htmlFor="trial-academy" className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-pine" />
            <span>Academy ya School ka Naam</span>
          </label>
          <input
            id="trial-academy"
            name="academyName"
            type="text"
            required
            disabled={isPending}
            placeholder="e.g. Quaid Science Academy"
            value={academyName}
            onChange={(e) => setAcademyName(e.target.value)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all ${
              fieldErrors.academyName ? "border-red-400 bg-red-50/30" : "border-[#DDD6C8]"
            }`}
          />
          {fieldErrors.academyName && (
            <p className="text-[11px] text-red-600 font-medium">{fieldErrors.academyName}</p>
          )}
        </div>

        {/* Phone Number (Pakistani validation) */}
        <div className="space-y-1.5">
          <label htmlFor="trial-phone" className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-pine" />
            <span>Mobile Number (WhatsApp)</span>
          </label>
          <input
            id="trial-phone"
            name="phone"
            type="tel"
            required
            disabled={isPending}
            placeholder="03001234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine font-mono transition-all ${
              fieldErrors.phone ? "border-red-400 bg-red-50/30" : "border-[#DDD6C8]"
            }`}
          />
          {fieldErrors.phone ? (
            <p className="text-[11px] text-red-600 font-medium">{fieldErrors.phone}</p>
          ) : (
            <p className="text-[11px] text-[#78756F]">Pakistani format: 03001234567</p>
          )}
        </div>

        {/* Email Address */}
        <div className="space-y-1.5">
          <label htmlFor="trial-email" className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-pine" />
            <span>Email Address</span>
          </label>
          <input
            id="trial-email"
            name="email"
            type="email"
            required
            disabled={isPending}
            placeholder="principal@academy.edu.pk"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full h-11 px-3.5 rounded-lg border text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all ${
              fieldErrors.email ? "border-red-400 bg-red-50/30" : "border-[#DDD6C8]"
            }`}
          />
          {fieldErrors.email && (
            <p className="text-[11px] text-red-600 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* Optional Password */}
        <div className="space-y-1.5">
          <label htmlFor="trial-password" className="text-xs font-semibold text-ink flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-pine" />
            <span>Password (Kam az kam 8 characters)</span>
          </label>
          <input
            id="trial-password"
            name="password"
            type="password"
            disabled={isPending}
            placeholder="At least 8 characters (or default used)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-11 px-3.5 rounded-lg border border-[#DDD6C8] text-sm text-ink placeholder:text-[#9A968D] bg-[#FAF8F5] focus:bg-white focus:outline-none focus:ring-2 focus:ring-pine transition-all"
          />
        </div>

        {/* Submit Button with Loading State */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full mt-2 h-12 rounded-xl bg-pine hover:bg-pine-hover text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Trial create ho raha hai...</span>
            </>
          ) : (
            <>
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-[11px] text-center text-[#78756F] pt-1">
          By signing up, you agree to our{" "}
          <Link href="/terms" className="underline hover:text-ink">Terms</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-ink">Privacy Policy</Link>.
        </p>
      </form>
    </div>
  );
}
