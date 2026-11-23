"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

const navLinks = [
  { name: "Features", href: "/features" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-[background-color,box-shadow,border-color] duration-200",
        // No backdrop-filter while the menu is open: it would trap the fixed menu panel inside the header box.
        open
          ? "border-b border-line bg-canvas"
          : scrolled
            ? "border-b border-line bg-canvas/90 backdrop-blur-md"
            : "border-b border-transparent bg-canvas"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-[76px] lg:px-8">
        <Link href="/" aria-label="EduFlow home" className="rounded-full focus-visible:outline-none focus-visible:shadow-focus">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-full px-4 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus",
                  active ? "bg-primary-tint text-primary" : "text-ink-2 hover:bg-surface-sunken hover:text-ink"
                )}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Link
            href="/login"
            className="press inline-flex h-11 items-center rounded-full border border-line-strong bg-surface px-5 text-[15px] font-semibold text-ink hover:bg-surface-sunken focus-visible:outline-none focus-visible:shadow-focus"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="press inline-flex h-11 items-center rounded-full bg-primary px-5 text-[15px] font-semibold text-white hover:bg-primary-hover focus-visible:outline-none focus-visible:shadow-focus"
          >
            Start free trial
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          className="press inline-flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-surface-sunken focus-visible:outline-none focus-visible:shadow-focus lg:hidden"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto bg-canvas px-4 pb-8 pt-2 duration-200 animate-in fade-in slide-in-from-top-2 sm:px-6 lg:hidden"
        >
          <nav aria-label="Main mobile" className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-14 items-center justify-between border-b border-line text-[18px] font-medium",
                  isActive(link.href) ? "text-primary" : "text-ink"
                )}
              >
                {link.name}
                <span aria-hidden className="text-ink-3">→</span>
              </Link>
            ))}
          </nav>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link
              href="/signup"
              className="press inline-flex h-12 items-center justify-center rounded-full bg-primary text-[16px] font-semibold text-white"
            >
              Start free trial
            </Link>
            <Link
              href="/login"
              className="press inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-surface text-[16px] font-semibold text-ink"
            >
              Log in
            </Link>
          </div>
          <p className="mt-6 text-center text-small text-ink-3">14 days free · No card needed</p>
        </div>
      )}
    </header>
  );
}
