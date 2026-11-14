import {
  Receipt,
  QrCode,
  FileSpreadsheet,
  Timer,
  BookOpenCheck,
  ShieldAlert,
  Layers,
} from "lucide-react";

export function FeaturesBento() {
  return (
    <section id="features" className="py-20 md:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Section Header */}
      <div className="max-w-3xl mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D8D1C4] bg-[#F1ECE2] px-3.5 py-1 text-xs font-semibold text-ink mb-4">
          <span className="w-1.5 h-1.5 rounded-full bg-pine" />
          <span>Core Capabilities</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-ink leading-tight">
          Har feature Pakistan ke educational landscape ke mutabiq.
        </h2>
        <p className="mt-4 text-base sm:text-lg text-[#55534D] leading-relaxed font-sans">
          Har school aur coaching academy ke ahem tareen kamo ke liye specific tools — baghair kisi unnecessary complication ke.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Students & Fees */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] flex items-center justify-center text-pine">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Students & Fee Challans</h3>
              <p className="mt-2 text-sm text-[#55534D] leading-relaxed font-sans">
                Standard 3-copy fee challan PDF generation (Bank, School, Parent copies) with batch-wise fee scheduling.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#6B6B64]">
            <span className="font-medium text-pine">Defaulters tracking & ledger</span>
            <span>JazzCash & Easypaisa</span>
          </div>
        </div>

        {/* Card 2: Attendance */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] flex items-center justify-center text-pine">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">10-Minute QR Attendance</h3>
              <p className="mt-2 text-sm text-[#55534D] leading-relaxed font-sans">
                Cryptographically signed, time-limited QR codes prevent proxy attendance; teacher can also mark manually.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#6B6B64]">
            <span className="font-medium text-pine">Instant absence alert</span>
            <span>HMAC-SHA256 Token</span>
          </div>
        </div>

        {/* Card 3: Tests & Results */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] flex items-center justify-center text-pine">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Tests & Printable Result Cards</h3>
              <p className="mt-2 text-sm text-[#55534D] leading-relaxed font-sans">
                Quick marks entry by subject and batch. Student report cards generated with rank, percentage, and teacher remarks.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#6B6B64]">
            <span className="font-medium text-pine">Verification workflow</span>
            <span>Parent portal sync</span>
          </div>
        </div>

        {/* Card 4: Online Test Engine */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] flex items-center justify-center text-pine">
              <Timer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Online Test Engine</h3>
              <p className="mt-2 text-sm text-[#55534D] leading-relaxed font-sans">
                Browser-based timed MCQ tests with server-side timers, question shuffling, and configurable negative marking.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#6B6B64]">
            <span className="font-medium text-pine">Instant auto-grading</span>
            <span>Batch leaderboard</span>
          </div>
        </div>

        {/* Card 5 (BIG CARD): AI Paper Generator (2 columns on lg) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#DDD6C8] bg-[#FAF8F4] p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="w-11 h-11 rounded-xl bg-pine text-white flex items-center justify-center shadow-sm">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#EAE3D5] text-[#42403B] border border-[#DDD4C3]">
                <Layers className="w-3.5 h-3.5 text-pine" />
                <span>288 Official Schemes • PECTAA 2026–2027</span>
              </span>
            </div>

            <div>
              <h3 className="font-display text-2xl font-bold text-ink">
                Board-Aware AI Paper Generator
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[#55534D] leading-relaxed font-sans max-w-2xl">
                Official Punjab BISE pairing schemes stored as verified data. Deterministic code enforces exact question distribution, while AI writes authentic questions strictly within syllabus boundaries.
              </p>
            </div>

            {/* Mini Scheme Visual (Real Chips) */}
            <div className="rounded-xl border border-[#DDD6C8] bg-white p-4 space-y-3 shadow-inner">
              <div className="flex items-center justify-between text-xs text-[#6B6B64] pb-2 border-b border-[#EFE9DF]">
                <span className="font-semibold text-ink">Physics 10th • BISE Lahore Scheme Structure</span>
                <span className="text-pine font-medium">Teacher Verified</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#DDD6C8] text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pine" />
                  <span>12 MCQs (12 Marks)</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#DDD6C8] text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pine" />
                  <span>24 Short Qs (Select 15)</span>
                </div>
                <div className="px-3 py-1.5 rounded-lg bg-[#FAF7F2] border border-[#DDD6C8] text-xs font-semibold text-ink flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-pine" />
                  <span>3 Long Qs (Select 2)</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#6B6B64]">
            <span className="font-medium text-pine">Covering 9th–12th across all 9 Punjab BISE boards</span>
            <span>Deterministic Pairing Logic</span>
          </div>
        </div>

        {/* Card 6: AI Risk Analytics */}
        <div className="rounded-2xl border border-[#DDD6C8] bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm hover:border-[#C8BFAD] hover:shadow-md transition-all duration-200">
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-xl bg-[#F4EFE6] border border-[#DDD6C8] flex items-center justify-center text-amber-700">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-ink">Deterministic Dropout Risk</h3>
              <p className="mt-2 text-sm text-[#55534D] leading-relaxed font-sans">
                Identifies at-risk students through hardcoded rules (attendance &lt; 75%, fee overdue &gt; 1 month, declining test marks) before they drop out.
              </p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-[#EAE4D8] flex items-center justify-between text-xs text-[#6B6B64]">
            <span className="font-medium text-amber-800">Clear LOW / MED / HIGH status</span>
            <span>Plain-language explanation</span>
          </div>
        </div>
      </div>
    </section>
  );
}
