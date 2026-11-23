import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Building2, GraduationCap, Users } from "@/components/icons";

const roles = [
  { label: "I run a school or academy", hint: "Start a 14-day free trial", href: "/signup", icon: Building2, primary: true },
  { label: "I'm a teacher", hint: "Sign in to mark attendance & marks", href: "/login", icon: GraduationCap },
  { label: "I'm a parent", hint: "See fees, results & attendance", href: "/login", icon: Users },
];

const facts = [
  { title: "JazzCash & Easypaisa", body: "Fees paid online, matched to invoices automatically" },
  { title: "Urdu + English", body: "Parent messages that actually get read" },
  { title: "Punjab boards", body: "Paper schemes for 9th–12th built in" },
  { title: "14 days free", body: "No card needed — set up in an afternoon" },
];

function AttendanceRing() {
  return (
    <svg viewBox="0 0 36 36" className="h-12 w-12 shrink-0 sm:h-14 sm:w-14" aria-hidden>
      <circle cx="18" cy="18" r="15" fill="none" stroke="#F0EAE2" strokeWidth="4" />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="rgb(var(--primary))"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="86 100"
        pathLength={100}
        transform="rotate(-90 18 18)"
        className="animate-ring"
      />
    </svg>
  );
}

const card =
  "absolute rounded-2xl bg-surface/95 p-3 shadow-[0_24px_48px_-16px_rgba(28,25,23,.28),0_0_0_1px_rgba(28,25,23,.05)] backdrop-blur sm:p-4 animate-rise-in";

export function HeroSection() {
  return (
    <section className="overflow-x-clip">
      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-14 pt-8 sm:px-6 sm:pt-12 md:grid-cols-2 md:gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-10 [&>*]:min-w-0">
        {/* Copy */}
        <div className="animate-rise-in">
          <p className="text-[12.5px] font-semibold uppercase tracking-[0.16em] text-primary">
            School management, done beautifully
          </p>
          <h1 className="mt-4 font-serif text-[52px] leading-[0.98] tracking-[-0.02em] text-ink sm:text-[66px] md:text-[56px] lg:text-[76px] xl:text-[86px]">
            Less paperwork.
            <br />
            <em className="text-primary">More teaching.</em>
          </h1>
          <p className="mt-6 max-w-[540px] text-[17px] leading-relaxed text-ink-2 sm:text-[18.5px]">
            EduFlow runs attendance, fees, exams and parent updates for schools and academies across Pakistan — so
            principals lead, teachers teach and parents stay in the loop.
          </p>

          <p className="mt-8 text-[14px] font-medium text-ink-3">First, tell us who you are</p>
          <ul className="mt-3 grid max-w-[460px] gap-2.5">
            {roles.map((r) => {
              const Icon = r.icon;
              return (
                <li key={r.label}>
                  <Link
                    href={r.href}
                    className={
                      "group press flex min-h-[60px] items-center gap-3.5 rounded-2xl border bg-surface px-4 py-3 shadow-1 transition-[border-color,box-shadow] focus-visible:outline-none focus-visible:shadow-focus " +
                      (r.primary
                        ? "border-primary ring-4 ring-primary-tint"
                        : "border-line hover:border-line-strong hover:shadow-2")
                    }
                  >
                    <span
                      className={
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full " +
                        (r.primary ? "bg-primary text-white" : "bg-surface-sunken text-ink-2")
                      }
                    >
                      <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[16px] font-semibold text-ink">{r.label}</span>
                      <span className="block truncate text-[13px] text-ink-3">{r.hint}</span>
                    </span>
                    <ArrowRight
                      className="h-[18px] w-[18px] shrink-0 text-primary transition-transform group-hover:translate-x-0.5"
                      strokeWidth={1.75}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Visual */}
        <div className="relative mx-auto w-full max-w-[560px] md:max-w-none">
          <div className="relative ml-0 aspect-[4/5] overflow-hidden rounded-[28px] bg-surface-sunken sm:ml-10 sm:aspect-[1/1] md:ml-6 md:aspect-[4/5] lg:ml-10 lg:aspect-[11/12]">
            <Image
              src="/images/students-laptop.jpg"
              alt="Two students in hijab working together on a laptop in a bright classroom"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 620px"
              className="object-cover object-[58%_40%]"
            />
          </div>

          {/* Attendance */}
          <div className={card + " left-3 top-4 w-[196px] sm:left-0 sm:top-10 sm:w-[250px] md:w-[220px] lg:w-[250px]"} style={{ animationDelay: "150ms" }}>
            <p className="text-[11.5px] font-medium text-ink-3 sm:text-[12.5px]">Attendance · Class 9-B</p>
            <div className="mt-2 flex items-center gap-3">
              <AttendanceRing />
              <div>
                <p className="text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink sm:text-[30px]">
                  31/34
                </p>
                <span className="mt-1.5 inline-flex rounded-full bg-status-success-bg px-2 py-0.5 text-[11.5px] font-semibold text-status-success">
                  Marked in 28s
                </span>
              </div>
            </div>
          </div>

          {/* Fee */}
          <div
            className={card + " right-3 top-[46%] w-[176px] sm:right-0 sm:w-[232px] md:w-[200px] lg:w-[232px] xl:-right-6"}
            style={{ animationDelay: "300ms" }}
          >
            <p className="text-[11.5px] font-medium text-ink-3 sm:text-[12.5px]">Fee received</p>
            <p className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.02em] tabular-nums text-ink sm:text-[28px]">
              PKR 4,500
            </p>
            <p className="mt-0.5 text-[12px] text-ink-2 sm:text-[13px]">Hamza Tariq · via JazzCash</p>
          </div>

          {/* Parent message */}
          <div
            className={card + " bottom-4 left-3 right-14 sm:bottom-10 sm:left-0 sm:right-auto sm:w-[300px] md:w-[260px] lg:w-[300px]"}
            style={{ animationDelay: "450ms" }}
          >
            <p className="text-[11.5px] font-medium text-ink-3 sm:text-[12.5px]">Message to parent · 8:12 am</p>
            <p className="mt-1.5 text-[13px] leading-snug text-ink sm:text-[14px]">
              Assalam-o-Alaikum. <strong className="font-semibold text-primary">Zainab</strong> is absent today (Tue
              24 Nov). Reply 1 to inform the school.
            </p>
          </div>
        </div>
      </div>

      {/* Facts */}
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-6 border-t border-line py-8 lg:grid-cols-4 lg:py-10">
          {facts.map((f) => (
            <div key={f.title}>
              <dt className="text-[17px] font-bold text-ink sm:text-[20px]">{f.title}</dt>
              <dd className="mt-1 text-[14px] leading-snug text-ink-2">{f.body}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
