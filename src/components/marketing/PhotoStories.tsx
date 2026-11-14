import Image from "next/image";
import { QrCode, MessageSquare, BarChart3, Check, AlertCircle } from "lucide-react";

export function PhotoStories() {
  return (
    <div className="space-y-24 sm:space-y-32 py-20 md:py-28 overflow-hidden">
      {/* Story (a): teacher-attendance.jpg — Attendance 30 second mein */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Photo: on mobile order-1 (stacks above text), on desktop order-1 (left) */}
          <div className="order-1 lg:order-1 lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#DDD6C8] shadow-lg bg-[#EFEAE0]">
              <Image
                src="/images/teacher-attendance.jpg"
                alt="Teacher conducting class attendance in Pakistan"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover photo-warm select-none transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-[#EAE4D9] flex items-center justify-between text-xs shadow-md">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-semibold text-ink">Token Expires in 08:42</span>
                </div>
                <span className="font-mono text-[11px] text-[#6B6B64]">Batch 10-A • Lahore</span>
              </div>
            </div>
          </div>

          {/* Text: on mobile order-2, on desktop order-2 (right) */}
          <div className="order-2 lg:order-2 lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink">
              <QrCode className="w-3.5 h-3.5 text-pine" />
              <span>QR Attendance & Instant Logging</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
              Attendance 30 second mein.
            </h2>

            <p className="text-base sm:text-lg text-[#55534D] leading-relaxed font-sans">
              Teacher session shuru hotay hi class ke liye time-limited QR display karta hai. Students apnay smartphone se scan kartay hain aur hazri foran mark ho jati hai.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-[#4A4843]">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>10-Minute HMAC Tokens:</strong> Screen capture ya photo forward karkay proxy attendance lagana namumkin hai.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Manual Override:</strong> Jin bachon ke paas phone nahi hai, unhein teacher ek tap mein manual &apos;Present&apos; mark kar sakta hai.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Automatic Absence Queue:</strong> Ghaib bachon ke parents ko session end par automated message dispatch ho jata hai.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Story (b): parent-phone.jpg — Parents ko WhatsApp par khabar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Photo: on mobile order-1 (stacks above text), on desktop order-2 (right) */}
          <div className="order-1 lg:order-2 lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#DDD6C8] shadow-lg bg-[#EFEAE0]">
              <Image
                src="/images/parent-phone.jpg"
                alt="Pakistani parent checking academy notifications on mobile phone"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover photo-warm select-none transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-[#EAE4D9] text-xs shadow-md space-y-1">
                <div className="flex items-center justify-between text-ink font-semibold">
                  <span>WhatsApp Cloud API</span>
                  <span className="text-emerald-700">Delivered</span>
                </div>
                <p className="text-[11px] text-[#6B6B64] italic">
                  &quot;Mohtaram Walid, Ahmed Raza aaj Physics class se ghair-hazir hai.&quot;
                </p>
              </div>
            </div>
          </div>

          {/* Text: on mobile order-2, on desktop order-1 (left) */}
          <div className="order-2 lg:order-1 lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink">
              <MessageSquare className="w-3.5 h-3.5 text-pine" />
              <span>Parent Portal & WhatsApp Bot</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
              Parents ko WhatsApp par khabar.
            </h2>

            <p className="text-base sm:text-lg text-[#55534D] leading-relaxed font-sans">
              Jab bacha ghair-hazir ho ya fee challan issue ho, parents ko foran update milti hai. Parents simple messages bhej kar due fee aur marks bhi maloom kar saktay hain.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-[#4A4843]">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Interactive Bot:</strong> Walid &quot;fee&quot;, &quot;hazri&quot; ya &quot;result&quot; likh kar apnay verified number se linked bachon ka record dekh saktay hain.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Tenant Isolation Guarantee:</strong> Anjaan phone numbers ko kisi bache ka data kabhi reveal nahi hota.
                </span>
              </li>
            </ul>

            {/* Honest Technical Note */}
            <div className="rounded-xl bg-[#FAF5EC] border border-[#E6D7BD] p-4 text-xs text-[#6B5A3E] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[#5A4525]">
                <AlertCircle className="w-4 h-4 text-amber-700" />
                <span>Honesty Note regarding WhatsApp Business</span>
              </div>
              <p className="leading-relaxed">
                Live automated WhatsApp messages require an approved Meta WhatsApp Cloud API phone number and verified business. Until verification is configured, AcademyHub defaults safely to its internal audit log driver.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Story (c): principal-reports.jpg — Principal ko sab kuch ek screen par */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Photo: on mobile order-1 (stacks above text), on desktop order-1 (left) */}
          <div className="order-1 lg:order-1 lg:col-span-6">
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#DDD6C8] shadow-lg bg-[#EFEAE0]">
              <Image
                src="/images/principal-reports.jpg"
                alt="School principal desk with academic reports and management tools"
                fill
                sizes="(max-width: 1024px) 100vw, 600px"
                className="object-cover photo-warm select-none transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl p-3 border border-[#EAE4D9] flex items-center justify-between text-xs shadow-md">
                <span className="font-semibold text-ink">Total Defaulters: 7 Students</span>
                <span className="text-amber-800 font-medium">PKR 31,500 Overdue</span>
              </div>
            </div>
          </div>

          {/* Text: on mobile order-2, on desktop order-2 (right) */}
          <div className="order-2 lg:order-2 lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink">
              <BarChart3 className="w-3.5 h-3.5 text-pine" />
              <span>Executive Dashboard & Defaulter Tracking</span>
            </div>

            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
              Principal ko sab kuch ek screen par.
            </h2>

            <p className="text-base sm:text-lg text-[#55534D] leading-relaxed font-sans">
              Kitni fee collect hui, kitnay bachay absent hain, kaun se students dropout hone ke risk par hain — principal ko register kholay baghair poora hisaab milta hai.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-[#4A4843]">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>One-Click Defaulters List:</strong> 30 din se zyada late fees walay students ko filter karein aur re-challan print karein.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Dropout Risk Identification:</strong> Attendance, fee arrears aur exam score drops ko combine karke risk pehle se identify hota hai.
                </span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[#EBF3EE] text-pine flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                </div>
                <span>
                  <strong>Teacher Payroll Ledger:</strong> Monthly faculty salaries, hourly rates, aur payment receipts ka complete audit record.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
