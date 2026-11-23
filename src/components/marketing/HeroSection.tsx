import Image from "next/image";
import Link from "next/link";
import { BorderBeam, BlurFade, DotPattern, Marquee } from "@/components/magicui";
import { shimmerClass } from "@/components/magicui/styles";
import {
  Award,
  CalendarDays,
  MessageSquareText,
  QrCode,
  Receipt,
  Wallet,
  FileText,
  MonitorCheck,
} from "@/components/icons";

const facts = [
  { icon: Wallet, text: "JazzCash & Easypaisa fees" },
  { icon: Receipt, text: "PKR fee challans" },
  { icon: MessageSquareText, text: "Urdu & English parent alerts" },
  { icon: QrCode, text: "10-minute QR attendance" },
  { icon: MonitorCheck, text: "Timed online tests" },
  { icon: FileText, text: "Punjab board paper schemes" },
  { icon: Award, text: "Locked result cards" },
  { icon: CalendarDays, text: "Clash-free timetables" },
];

/** A real screenshot of the admin dashboard (demo school data), framed as a browser window. */
function ProductWindow() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="absolute -inset-10 -z-10 rounded-[48px] bg-[radial-gradient(closest-side,rgba(74,98,232,.28),transparent)] blur-2xl"
      />
      <div className="relative overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_40px_80px_-32px_rgba(11,16,48,.45)] sm:rounded-[22px]">
        <BorderBeam size={180} duration={9} colorFrom="#AAB6FA" colorTo="#2743D6" borderWidth={1.5} />
        <div className="flex h-9 items-center gap-2 border-b border-line bg-canvas px-4 sm:h-10">
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          <span className="ml-3 truncate rounded-md bg-surface px-2.5 py-0.5 font-mono text-[11.5px] text-ink-3">
            riverside.eduflow.app/admin
          </span>
        </div>
        <Image
          src="/images/screens/admin-dashboard.jpg"
          alt="EduFlow admin dashboard showing fees collected, attendance, defaulters and recent tests for a school"
          width={2880}
          height={1800}
          priority
          sizes="(min-width: 1024px) 640px, 100vw"
          className="block h-auto w-full"
        />
      </div>

      {/* Phone view of the same dashboard, floating over the corner on larger screens */}
      <div className="absolute -bottom-10 -left-8 hidden w-[132px] rotate-[-4deg] overflow-hidden rounded-[26px] border-[5px] border-sidebar bg-sidebar shadow-[0_30px_60px_-20px_rgba(11,16,48,.55)] sm:block lg:-left-12 lg:w-[150px]">
        <Image
          src="/images/screens/admin-mobile.jpg"
          alt="The same admin dashboard on a phone"
          width={1170}
          height={2532}
          sizes="150px"
          className="block h-auto w-full rounded-[20px]"
        />
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="relative isolate overflow-x-clip">
      <DotPattern className="-z-10 [mask-image:radial-gradient(ellipse_60%_55%_at_50%_30%,#000_30%,transparent_75%)]" />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-260px] -z-10 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(170,182,250,.45),transparent)]"
      />

      <div className="mx-auto grid max-w-[1240px] items-center gap-12 px-4 pb-14 pt-10 sm:px-6 sm:pt-14 lg:grid-cols-[1fr_1.08fr] lg:gap-14 lg:px-8 lg:pb-20 lg:pt-16 [&>*]:min-w-0">
        <BlurFade>
          <Link
            href="/features"
            className="inline-flex max-w-full items-center gap-2 rounded-full border border-line bg-surface/80 py-1 pl-1 pr-3.5 text-[13.5px] font-medium text-ink-2 shadow-1 backdrop-blur transition-colors hover:border-line-strong hover:text-ink"
          >
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-[12px] font-semibold text-white">New</span>
            <span className="truncate">Fees now reconcile with JazzCash and Easypaisa</span>
          </Link>
          <h1 className="mt-6 text-balance font-serif text-[44px] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink sm:text-[60px] lg:text-[66px] xl:text-[74px]">
            Run your whole school from one calm screen.
          </h1>
          <p className="mt-6 max-w-[540px] text-pretty text-[17.5px] leading-relaxed text-ink-2 sm:text-[19px]">
            Attendance, fee collection, exams and parent updates for schools and academies in Pakistan. Your office
            closes the day before the last bell.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/signup" className={shimmerClass + " h-12 text-[16px]"}>
              Start a free 14-day trial
            </Link>
            <Link
              href="/pricing"
              className="press inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-surface px-6 text-[16px] font-semibold text-ink hover:bg-surface-sunken focus-visible:outline-none focus-visible:shadow-focus"
            >
              See pricing in rupees
            </Link>
          </div>
          <p className="mt-5 text-[14px] text-ink-3">No card needed. Set up classes and mark tomorrow&apos;s attendance today.</p>
        </BlurFade>

        <BlurFade delay={0.15}>
          <ProductWindow />
        </BlurFade>
      </div>

      <div className="border-y border-line bg-surface/70 py-5 backdrop-blur">
        <Marquee duration={45} className="[mask-image:linear-gradient(to_right,transparent,#000_8%,#000_92%,transparent)]">
          {facts.map(({ icon: I, text }) => (
            <span key={text} className="inline-flex items-center gap-2.5 whitespace-nowrap text-[15px] font-medium text-ink-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-tint text-primary">
                <I className="h-4 w-4" />
              </span>
              {text}
            </span>
          ))}
        </Marquee>
      </div>
    </section>
  );
}
