import Link from "next/link";
import { Logo } from "@/components/brand/Logo";

const columns = [
  {
    title: "Product",
    links: [
      { name: "Features", href: "/features" },
      { name: "Pricing", href: "/pricing" },
      { name: "Start free trial", href: "/signup" },
      { name: "Log in", href: "/login" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { name: "Privacy policy", href: "/privacy" },
      { name: "Terms of service", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-line bg-canvas text-ink">
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-6 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link href="/" aria-label="EduFlow home" className="inline-block rounded-md focus-visible:outline-none focus-visible:shadow-focus">
              <Logo />
            </Link>
            <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
              Attendance, fees, results and parent updates for Pakistani schools and academies.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-3">{col.title}</h2>
              <ul className="mt-4 space-y-3">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="rounded-sm text-[15px] text-ink-2 transition-colors hover:text-primary focus-visible:outline-none focus-visible:shadow-focus"
                    >
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-small text-ink-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} EduFlow. All rights reserved.</p>
          <p>Made for schools in Pakistan · Prices in PKR</p>
        </div>
      </div>
    </footer>
  );
}
