import Link from "next/link";

export function CtaSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 sm:pb-24 lg:px-8">
      <div className="relative mx-auto max-w-[1240px] overflow-hidden rounded-[32px] bg-primary px-6 py-16 text-center text-white sm:px-12 sm:py-20">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/[0.06]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-white/[0.05]"
        />
        <h2 className="relative mx-auto max-w-[760px] text-balance font-serif text-[40px] leading-[1.02] tracking-[-0.015em] sm:text-[56px] lg:text-[64px]">
          Give your office its afternoons back.
        </h2>
        <p className="relative mx-auto mt-5 max-w-[560px] text-[17px] leading-relaxed text-white/80">
          Start free for 14 days with every feature. No card needed — set up classes and mark tomorrow&apos;s attendance
          today.
        </p>
        <div className="relative mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="press inline-flex h-12 items-center justify-center rounded-full bg-white px-7 text-[16px] font-semibold text-primary hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
          >
            Start free trial
          </Link>
          <Link
            href="/contact"
            className="press inline-flex h-12 items-center justify-center rounded-full border border-white/30 px-7 text-[16px] font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Book a walkthrough
          </Link>
        </div>
      </div>
    </section>
  );
}
