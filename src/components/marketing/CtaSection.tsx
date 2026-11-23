import Link from "next/link";

/** Closing band on the greenboard itself, with faint chalk ruling. */
export function CtaSection() {
  return (
    <section className="relative isolate overflow-hidden bg-sidebar text-sidebar-ink">
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07] [background-image:repeating-linear-gradient(to_bottom,transparent_0,transparent_47px,#E8EFEC_47px,#E8EFEC_48px)]"
      />
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-4 py-20 sm:px-6 md:flex-row md:items-end md:justify-between md:py-24">
        <div className="max-w-[640px]">
          <h2 className="text-balance font-serif text-[32px] leading-[1.15] md:text-display-m">
            Set up your academy this afternoon.
          </h2>
          <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-sidebar-ink-2">
            Free for 14 days with every Pro feature. No card needed — add classes, admit students and mark tomorrow&apos;s
            attendance in EduFlow.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/signup"
            className="press inline-flex h-12 items-center justify-center rounded-md bg-white px-6 text-[16px] font-medium text-primary hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-sidebar"
          >
            Start free trial
          </Link>
          <Link
            href="/contact"
            className="press inline-flex h-12 items-center justify-center rounded-md border border-white/25 px-6 text-[16px] font-medium text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            Book a walkthrough
          </Link>
        </div>
      </div>
    </section>
  );
}
