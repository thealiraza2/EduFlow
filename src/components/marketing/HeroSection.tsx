import Link from "next/link";
import Image from "next/image";

const facts = [
  "Fee challans in PKR",
  "JazzCash & Easypaisa",
  "Parent updates in Urdu & English",
  "Punjab board paper schemes",
];

/**
 * Full-bleed photo hero (DESIGN.md §6). Desktop: the serif headline sits on the
 * calm left side of the photo behind an ink scrim. Phones: photo band on top,
 * text below on the greenboard so it never covers the student's face.
 */
export function HeroSection() {
  return (
    <section className="relative isolate bg-sidebar text-white md:flex md:min-h-[min(860px,100svh)] md:flex-col md:justify-end md:overflow-hidden">
      <div className="relative h-[min(72vw,420px)] md:absolute md:inset-0 md:-z-10 md:h-auto">
        <Image
          src="/images/student-writing.jpg"
          alt="A student in a white shirt and maroon tie smiling at his desk, classmates behind him"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[64%_30%] md:object-[60%_35%]"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(15,23,20,.55)_0%,rgba(15,23,20,0)_32%,rgba(15,23,20,0)_62%,rgb(15,42,37)_100%)] md:bg-[linear-gradient(to_top_right,rgba(15,23,20,.85)_0%,rgba(15,23,20,.5)_42%,rgba(15,23,20,0)_72%),linear-gradient(to_bottom,rgba(15,23,20,.45)_0%,rgba(15,23,20,0)_20%)]"
        />
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 pb-12 pt-2 sm:px-6 md:pb-20 md:pt-28">
        <div className="max-w-[640px] animate-rise-in">
          <p className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/75">
            School management for Pakistan
          </p>
          <h1 className="mt-4 text-balance font-serif text-[38px] leading-[1.08] tracking-[-0.015em] sm:text-[52px] md:text-display-xl">
            Every register, fee and result, kept in order.
          </h1>
          <p className="mt-5 max-w-[54ch] text-pretty text-[17px] leading-relaxed text-white/85 md:text-body-l">
            EduFlow brings attendance, fee collection, exams and parent updates into one calm system — so your
            office spends the afternoon on students, not paperwork.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/signup"
              className="press inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-[16px] font-medium text-primary hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              Start free 14-day trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex h-12 items-center justify-center rounded-md px-4 text-[16px] font-medium text-white underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              See pricing in PKR
            </Link>
          </div>
        </div>

        <ul className="mt-12 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/15 pt-5 text-[14px] text-white/75">
          {facts.map((f) => (
            <li key={f} className="flex items-center gap-2">
              <span aria-hidden className="h-1 w-1 rounded-full bg-white/60" />
              {f}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
