import Image from "next/image";
import { RegisterPreview } from "./RegisterPreview";

function FeePreview() {
  const rows = [
    { name: "Ayesha Siddiqui", month: "Nov 2026", amount: "4,500", status: "Paid", tone: "success" },
    { name: "Zainab Rafiq", month: "Nov 2026", amount: "4,500", status: "Partial", tone: "warning" },
    { name: "Abdullah Khan", month: "Oct 2026", amount: "5,000", status: "Overdue", tone: "danger" },
  ] as const;
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-surface shadow-2">
      <div className="flex items-end justify-between border-b border-line px-5 py-4">
        <div>
          <p className="text-small text-ink-3">Collected this month</p>
          <p className="mt-1 text-[26px] font-semibold leading-none tabular-nums text-ink">PKR 3,82,500</p>
        </div>
        <p className="text-right text-small text-ink-3">
          <span className="block font-semibold tabular-nums text-status-success">86%</span>of invoices
        </p>
      </div>
      <div className="h-1.5 bg-surface-sunken">
        <div className="h-full w-[86%] bg-primary" />
      </div>
      <ul>
        {rows.map((r) => (
          <li key={r.name} className="flex h-12 items-center gap-3 border-b border-line px-5 last:border-0">
            <span className="min-w-0 flex-1 truncate text-[15px] text-ink">{r.name}</span>
            <span className="hidden text-small text-ink-3 sm:inline">{r.month}</span>
            <span className="w-[64px] text-right text-[14px] font-medium tabular-nums text-ink">{r.amount}</span>
            <span
              className={
                "inline-flex h-6 w-[64px] items-center justify-center rounded-sm text-[12px] font-semibold " +
                (r.tone === "success"
                  ? "bg-status-success-bg text-status-success"
                  : r.tone === "warning"
                    ? "bg-status-warning-bg text-status-warning"
                    : "bg-status-danger-bg text-status-danger")
              }
            >
              {r.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ResultPreview() {
  const subjects = [
    { s: "Physics", m: 71, t: 75 },
    { s: "Mathematics", m: 68, t: 75 },
    { s: "English", m: 59, t: 75 },
  ];
  return (
    <div className="rounded-lg border border-line bg-surface p-5 shadow-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-serif text-[20px] leading-tight text-ink">Result card</p>
          <p className="mt-1 text-small text-ink-3">Muhammad Hamza Tariq · 9-B · Mid-term</p>
        </div>
        <span className="rounded-sm bg-status-success-bg px-2 py-0.5 text-[12px] font-semibold text-status-success">
          Published
        </span>
      </div>
      <ul className="mt-5 space-y-3">
        {subjects.map((x) => (
          <li key={x.s}>
            <div className="flex justify-between text-[14px]">
              <span className="text-ink-2">{x.s}</span>
              <span className="font-medium tabular-nums text-ink">
                {x.m}
                <span className="text-ink-3">/{x.t}</span>
              </span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-surface-sunken">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(x.m / x.t) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-[14px]">
        <span className="text-ink-2">Total</span>
        <span className="font-semibold tabular-nums text-ink">198 / 225 · Grade A · 3rd in class</span>
      </div>
    </div>
  );
}

const steps = [
  {
    time: "8:05",
    title: "Attendance before the first bell",
    body: "Teachers mark the whole class from their phone, or students scan a 10-minute QR code. Parents of absent students get a message the same morning.",
    visual: <RegisterPreview />,
  },
  {
    time: "11:30",
    title: "Fees that reconcile themselves",
    body: "Monthly invoices are created once, challans print as PDF, and JazzCash or Easypaisa payments mark the invoice paid on their own. Defaulters list is always current.",
    visual: <FeePreview />,
  },
  {
    time: "3:15",
    title: "Results parents can trust",
    body: "Teachers enter marks as a draft; once you publish, they lock. Parents download the official result card with grade and class position.",
    visual: <ResultPreview />,
  },
];

export function SchoolDaySection() {
  return (
    <section id="features" className="scroll-mt-20 bg-canvas py-20 md:py-28">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <div className="max-w-[720px]">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">A school day in EduFlow</p>
          <h2 className="mt-3 text-balance font-serif text-[32px] leading-[1.15] text-ink md:text-display-l">
            The office work of a whole day, done as it happens.
          </h2>
        </div>

        <ol className="mt-14 space-y-16 md:mt-20 md:space-y-24">
          {steps.map((step, i) => (
            <li key={step.time} className="grid items-center gap-8 md:grid-cols-12 md:gap-12">
              <div className={i % 2 === 1 ? "md:col-span-5 md:col-start-8 md:row-start-1" : "md:col-span-5"}>
                <p className="font-serif text-[44px] leading-none text-primary tabular-nums md:text-[56px]">
                  {step.time}
                </p>
                <h3 className="mt-4 text-h2 text-ink">{step.title}</h3>
                <p className="mt-3 max-w-[46ch] text-[16px] leading-relaxed text-ink-2">{step.body}</p>
              </div>
              <div
                className={
                  i % 2 === 1 ? "md:col-span-6 md:col-start-1 md:row-start-1" : "md:col-span-6 md:col-start-7"
                }
              >
                {step.visual}
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-12 text-small text-ink-3">Names and figures above are sample data.</p>
      </div>
    </section>
  );
}

export function PortalsSection() {
  const portals = [
    { who: "Owners & admins", what: "Admissions, fee collection, payroll, reports and every class at a glance." },
    { who: "Teachers", what: "Attendance, marks entry, online tests and a board-aware paper generator." },
    { who: "Parents", what: "Attendance %, dues, challans, results and online payment — for their own children only." },
    { who: "Students", what: "Timed online tests with instant MCQ scores and QR check-in." },
  ];
  return (
    <section className="border-t border-line bg-surface py-20 md:py-28">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 sm:px-6 md:grid-cols-12">
        <div className="relative aspect-[4/5] overflow-hidden rounded-photo md:col-span-5">
          <Image
            src="/images/student-girl.jpg"
            alt="A student in school uniform and hijab listening in class"
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover object-[40%_center]"
          />
        </div>
        <div className="md:col-span-6 md:col-start-7">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-accent">One record, four portals</p>
          <h2 className="mt-3 text-balance font-serif text-[32px] leading-[1.15] text-ink md:text-display-m">
            Everyone sees what is theirs — and nothing that isn&apos;t.
          </h2>
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {portals.map((p) => (
              <div key={p.who} className="grid gap-1 py-5 sm:grid-cols-[180px_1fr] sm:gap-6">
                <dt className="text-[15px] font-semibold text-ink">{p.who}</dt>
                <dd className="text-[15px] leading-relaxed text-ink-2">{p.what}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
