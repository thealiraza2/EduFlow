import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  MessageSquareText,
  MonitorCheck,
  Wallet,
} from "@/components/icons";
import { RegisterPreview } from "./RegisterPreview";

const container = "mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8";

function SectionHead({ kicker, title, body, center = false }: { kicker: string; title: React.ReactNode; body?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-[720px] text-center" : "max-w-[720px]"}>
      <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-primary">{kicker}</p>
      <h2 className="mt-3 text-balance font-serif text-[38px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[48px] lg:text-[56px]">
        {title}
      </h2>
      {body && <p className="mt-4 text-pretty text-[17px] leading-relaxed text-ink-2">{body}</p>}
    </div>
  );
}

/* ───────────────────────────── Features bento ───────────────────────────── */

function FeePreview() {
  const rows = [
    { name: "Ayesha Siddiqui", amount: "4,500", status: "Paid", tone: "bg-status-success-bg text-status-success" },
    { name: "Zainab Rafiq", amount: "2,000", status: "Partial", tone: "bg-status-warning-bg text-status-warning" },
    { name: "Abdullah Khan", amount: "5,000", status: "Overdue", tone: "bg-status-danger-bg text-status-danger" },
  ];
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12.5px] text-ink-3">Collected · November</p>
          <p className="mt-1 text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink">PKR 3,82,500</p>
        </div>
        <span className="text-[13px] font-semibold tabular-nums text-status-success">86%</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface-sunken">
        <div className="h-full w-[86%] rounded-full bg-primary" />
      </div>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center gap-3 py-2.5 text-[14px]">
            <span className="min-w-0 flex-1 truncate text-ink">{r.name}</span>
            <span className="tabular-nums text-ink-2">{r.amount}</span>
            <span className={"w-[62px] rounded-full py-0.5 text-center text-[11.5px] font-semibold " + r.tone}>{r.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultMini() {
  const rows = [
    { s: "Physics", m: 71 },
    { s: "Maths", m: 68 },
    { s: "English", m: 59 },
  ];
  return (
    <div className="space-y-3 rounded-2xl border border-line bg-surface p-4">
      {rows.map((x) => (
        <div key={x.s}>
          <div className="flex justify-between text-[13.5px]">
            <span className="text-ink-2">{x.s}</span>
            <span className="font-semibold tabular-nums text-ink">{x.m}/75</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-surface-sunken">
            <div className="h-full rounded-full bg-primary" style={{ width: `${(x.m / 75) * 100}%` }} />
          </div>
        </div>
      ))}
      <p className="border-t border-line pt-3 text-[13px] text-ink-2">
        Grade <b className="text-ink">A</b> · 3rd in class · <span className="text-status-success">Published</span>
      </p>
    </div>
  );
}

const smallFeatures = [
  {
    icon: MessageSquareText,
    title: "Parent messages",
    body: "Absence, fee and result alerts by SMS or WhatsApp — in Urdu or English.",
  },
  {
    icon: MonitorCheck,
    title: "Online tests",
    body: "Timed MCQ tests with instant marks, negative marking and a class leaderboard.",
  },
  {
    icon: FileText,
    title: "Paper generator",
    body: "Draft papers that follow Punjab board schemes for 9th to 12th.",
  },
  {
    icon: BarChart3,
    title: "Reports & payroll",
    body: "Defaulters, collection and attendance reports, plus teacher salary records.",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-24 lg:py-28">
      <div className={container}>
        <SectionHead
          kicker="Everything in one place"
          title={
            <>
              The whole school office, <em className="text-primary">finally organised.</em>
            </>
          }
          body="Replace registers, Excel sheets and scattered WhatsApp groups with one system your staff learns in a day."
        />

        <div className="mt-12 grid gap-4 sm:gap-5 lg:mt-16 lg:grid-cols-6 [&>*]:min-w-0">
          {/* Attendance — large */}
          <article className="rounded-[24px] border border-line bg-surface-sunken/60 p-5 sm:p-7 lg:col-span-3 lg:row-span-2">
            <h3 className="text-[22px] font-bold tracking-[-0.01em] text-ink sm:text-[24px]">Attendance in 30 seconds</h3>
            <p className="mt-2 max-w-[440px] text-[15.5px] leading-relaxed text-ink-2">
              Teachers mark the class from their phone or students scan a 10-minute QR code. Parents of absent
              children hear about it the same morning. Try it — tap a name.
            </p>
            <div className="mt-6">
              <RegisterPreview />
            </div>
          </article>

          {/* Fees */}
          <article className="rounded-[24px] border border-line bg-surface-sunken/60 p-5 sm:p-7 lg:col-span-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                <Wallet className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div>
                <h3 className="text-[20px] font-bold tracking-[-0.01em] text-ink">Fees that reconcile themselves</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
                  Monthly invoices, printable challans, and JazzCash or Easypaisa payments marked paid automatically.
                </p>
              </div>
            </div>
            <div className="mt-5">
              <FeePreview />
            </div>
          </article>

          {/* Results */}
          <article className="rounded-[24px] border border-line bg-surface-sunken/60 p-5 sm:p-7 lg:col-span-3">
            <div className="grid gap-5 sm:grid-cols-2 sm:items-center [&>*]:min-w-0">
              <div>
                <h3 className="text-[20px] font-bold tracking-[-0.01em] text-ink">Results parents trust</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-ink-2">
                  Marks stay draft until you publish — then they lock. Parents download the official result card.
                </p>
              </div>
              <ResultMini />
            </div>
          </article>
        </div>

        <div className="mt-4 grid gap-4 sm:mt-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4 [&>*]:min-w-0">
          {smallFeatures.map((f) => {
            const Icon = f.icon;
            return (
              <article key={f.title} className="rounded-[20px] border border-line bg-surface p-5 sm:p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-[17px] font-bold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{f.body}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <Link
            href="/features"
            className="press inline-flex h-12 items-center gap-2 rounded-full border border-line-strong bg-surface px-6 text-[15px] font-semibold text-ink hover:bg-surface-sunken focus-visible:outline-none focus-visible:shadow-focus"
          >
            See all 12 modules <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── How it works ───────────────────────────── */

const steps = [
  { n: "01", title: "Create your academy", body: "Sign up, choose your web address and add classes, sections and batches." },
  { n: "02", title: "Add students & teachers", body: "Admit students with guardian details. Admission numbers are generated for you." },
  { n: "03", title: "Run your first day", body: "Mark attendance, issue November invoices and invite parents — all before lunch." },
];

export function HowItWorksSection() {
  return (
    <section className="bg-sidebar py-20 text-sidebar-ink sm:py-24 lg:py-28">
      <div className={container}>
        <div className="max-w-[720px]">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-greenboard-300">Get started</p>
          <h2 className="mt-3 text-balance font-serif text-[38px] leading-[1.05] tracking-[-0.015em] sm:text-[48px] lg:text-[56px]">
            Live in one afternoon. <em className="text-greenboard-300">Not one term.</em>
          </h2>
        </div>
        <ol className="mt-12 grid gap-8 md:grid-cols-3 md:gap-6 lg:mt-16">
          {steps.map((s) => (
            <li key={s.n} className="border-t border-white/15 pt-6">
              <span className="font-serif text-[44px] leading-none text-greenboard-300">{s.n}</span>
              <h3 className="mt-4 text-[20px] font-bold">{s.title}</h3>
              <p className="mt-2 text-[15.5px] leading-relaxed text-sidebar-ink-2">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────────── Built for Pakistan ───────────────────────────── */

const local = [
  "Fee challans in PKR with bank, branch and due date",
  "JazzCash & Easypaisa payments matched to invoices",
  "SMS and WhatsApp alerts in Urdu or English",
  "Punjab board pairing schemes for 9th–12th",
  "Separate login for every parent — they only see their own children",
];

export function BuiltForPakistanSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className={container + " grid items-center gap-10 lg:grid-cols-2 lg:gap-16"}>
        <div className="relative order-2 aspect-[4/3] overflow-hidden rounded-[28px] lg:order-1 lg:aspect-[5/6]">
          <Image
            src="/images/electronics-lab.jpg"
            alt="Students working on circuits in a school electronics lab"
            fill
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-cover"
          />
        </div>
        <div className="order-1 lg:order-2">
          <SectionHead
            kicker="Made for Pakistan"
            title={
              <>
                Built around how <em className="text-primary">our schools</em> actually work.
              </>
            }
            body="Not a foreign tool with a currency switch. EduFlow is designed around PKR fee cycles, local payment wallets and board exams."
          />
          <ul className="mt-8 space-y-3.5">
            {local.map((l) => (
              <li key={l} className="flex items-start gap-3 text-[16px] text-ink">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-tint text-primary">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                {l}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── Pricing teaser ───────────────────────────── */

const plans = [
  { name: "Starter", price: "2,500", for: "Up to 100 students", popular: false },
  { name: "Growth", price: "5,000", for: "101 – 500 students", popular: true },
  { name: "Pro", price: "9,000", for: "500+ students & branches", popular: false },
];

export function PricingTeaserSection() {
  return (
    <section className="border-y border-line bg-surface py-20 sm:py-24">
      <div className={container}>
        <SectionHead center kicker="Simple pricing" title="One fair monthly price, in rupees." body="Every plan starts with 14 days free. No setup fee, no per-feature charges." />
        <div className="mx-auto mt-12 grid max-w-[980px] gap-4 sm:grid-cols-3 sm:gap-5">
          {plans.map((p) => (
            <div
              key={p.name}
              className={
                "relative rounded-[24px] border p-6 sm:p-7 " +
                (p.popular ? "border-primary bg-primary text-white shadow-3" : "border-line bg-canvas text-ink")
              }
            >
              {p.popular && (
                <span className="absolute -top-3 left-6 rounded-full bg-accent px-3 py-1 text-[12px] font-semibold text-white">
                  Most popular
                </span>
              )}
              <p className={"text-[15px] font-semibold " + (p.popular ? "text-white/85" : "text-ink-2")}>{p.name}</p>
              <p className="mt-3 flex items-baseline gap-1.5">
                <span className={"text-[14px] font-semibold " + (p.popular ? "text-white/80" : "text-ink-3")}>PKR</span>
                <span className="text-[40px] font-bold leading-none tracking-[-0.03em] tabular-nums">{p.price}</span>
                <span className={"text-[14px] " + (p.popular ? "text-white/80" : "text-ink-3")}>/month</span>
              </p>
              <p className={"mt-3 text-[14.5px] " + (p.popular ? "text-white/85" : "text-ink-2")}>{p.for}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex justify-center">
          <Link
            href="/pricing"
            className="press inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-[15px] font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            Compare plans <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────────── FAQ ───────────────────────────── */

const faqs = [
  {
    q: "Do parents need to install an app?",
    a: "No. Parents open EduFlow in any phone browser with their own login, and get SMS or WhatsApp alerts for absences, fees and results.",
  },
  {
    q: "Can we collect fees online?",
    a: "Yes. Parents can pay through JazzCash or Easypaisa and the invoice is marked paid automatically. Cash and bank payments are recorded by your office in a few clicks.",
  },
  {
    q: "Is our school's data private?",
    a: "Every academy's data is kept separate. Teachers only see their own classes and parents only see their own children.",
  },
  {
    q: "We already use Excel. Can you move our data?",
    a: "Yes — during your trial our team helps you import students, classes and fee plans so you start with real records.",
  },
  {
    q: "What happens after the 14-day trial?",
    a: "Choose a plan that fits your student count. If you don't continue, nothing is charged — there is no card on file.",
  },
];

export function FaqSection() {
  return (
    <section className="py-20 sm:py-24 lg:py-28">
      <div className={container + " grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16"}>
        <SectionHead
          kicker="Questions"
          title={
            <>
              Good questions, <em className="text-primary">straight answers.</em>
            </>
          }
          body="Still unsure? Our team replies within one working day."
        />
        <div className="divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-1">
              <summary className="flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-[17px] font-semibold text-ink focus-visible:outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden">
                {f.q}
                <span
                  aria-hidden
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line-strong text-[18px] leading-none text-ink-2 transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 pr-12 text-[15.5px] leading-relaxed text-ink-2">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
