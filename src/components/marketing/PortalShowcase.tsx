"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type Portal = {
  key: string;
  tab: string;
  title: string;
  body: string;
  src: string;
  url: string;
  alt: string;
};

const portals: Portal[] = [
  {
    key: "admin",
    tab: "School office",
    title: "The whole school on one page",
    body: "Fees collected, defaulters, today's attendance and the latest tests, the moment the office opens.",
    src: "/images/screens/admin-dashboard.jpg",
    url: "riverside.eduflow.app/admin",
    alt: "Admin dashboard with fees, attendance, low-attendance students and test results",
  },
  {
    key: "teacher",
    tab: "Teachers",
    title: "A teacher's day, already planned",
    body: "Lectures, batches, students who need attention and a marking queue. Attendance takes seconds.",
    src: "/images/screens/teacher-dashboard.jpg",
    url: "riverside.eduflow.app/teacher",
    alt: "Teacher dashboard with today's lectures and the weekly timetable",
  },
  {
    key: "parent",
    tab: "Parents",
    title: "Parents see what the school sees",
    body: "Attendance day by day, fee dues and challans, published results and the class timetable.",
    src: "/images/screens/parent-dashboard.jpg",
    url: "riverside.eduflow.app/parent",
    alt: "Parent portal showing a child's attendance, fee dues and results",
  },
];

export function PortalShowcase() {
  const [active, setActive] = useState(portals[0].key);
  const reduce = useReducedMotion();
  const current = portals.find((p) => p.key === active) ?? portals[0];

  return (
    <section className="relative overflow-x-clip bg-sidebar py-20 text-white sm:py-24 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[480px] w-[1000px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,98,232,.35),transparent)]"
      />
      <div className="relative mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="max-w-[720px]">
          <p className="text-[14px] font-semibold text-[#AAB6FA]">Real screens, not mock-ups</p>
          <h2 className="mt-3 text-balance font-serif text-[34px] font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-[46px] lg:text-[54px]">
            One system, a portal for everyone in the school.
          </h2>
          <p className="mt-5 max-w-[600px] text-[17px] leading-relaxed text-sidebar-ink-2">
            These are the actual EduFlow dashboards, filled with a sample school so no real student&apos;s data is shown.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="EduFlow portals"
          className="-mx-4 mt-10 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden"
        >
          {portals.map((p) => (
            <button
              key={p.key}
              role="tab"
              type="button"
              aria-selected={p.key === active}
              aria-controls={`portal-${p.key}`}
              onClick={() => setActive(p.key)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-2 text-[14.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#AAB6FA]",
                p.key === active
                  ? "border-white bg-white text-sidebar"
                  : "border-white/15 text-sidebar-ink-2 hover:border-white/35 hover:text-white",
              )}
            >
              {p.tab}
            </button>
          ))}
        </div>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_300px] lg:gap-12 [&>*]:min-w-0">
          <div id={`portal-${current.key}`} role="tabpanel" className="relative">
            <div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#141A3D] shadow-[0_50px_100px_-40px_rgba(0,0,0,.8)] sm:rounded-[20px]">
              <div className="flex h-9 items-center gap-2 border-b border-white/10 px-4">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-3 truncate rounded-md bg-white/5 px-2.5 py-0.5 font-mono text-[11.5px] text-sidebar-ink-2">
                  {current.url}
                </span>
              </div>
              <div className="relative aspect-[16/10] bg-canvas">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={current.key}
                    className="absolute inset-0"
                    initial={reduce ? false : { opacity: 0, scale: 1.01 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={reduce ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    <Image
                      src={current.src}
                      alt={current.alt}
                      fill
                      sizes="(min-width: 1024px) 860px, 100vw"
                      className="object-cover object-top"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row sm:items-start lg:flex-col">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-[24px] font-bold leading-tight tracking-[-0.03em]">{current.title}</h3>
              <p className="mt-3 text-[16px] leading-relaxed text-sidebar-ink-2">{current.body}</p>
            </div>
            <figure className="mx-auto w-[210px] shrink-0 sm:mx-0 lg:w-[230px]">
              <div className="overflow-hidden rounded-[30px] border-[6px] border-[#1F2652] bg-[#1F2652] shadow-[0_30px_60px_-24px_rgba(0,0,0,.8)]">
                <Image
                  src="/images/screens/parent-mobile.jpg"
                  alt="Parent portal on a phone showing a child's attendance and fee dues"
                  width={1170}
                  height={2532}
                  sizes="230px"
                  className="block h-auto w-full rounded-[24px]"
                />
              </div>
              <figcaption className="mt-3 text-center text-[13px] text-sidebar-ink-2">
                Works on any phone, no app to install
              </figcaption>
            </figure>
          </div>
        </div>
      </div>
    </section>
  );
}
