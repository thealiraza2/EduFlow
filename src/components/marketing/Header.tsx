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

/**
 * Marketing header. On the home page it starts transparent over the full-bleed
 * hero photo and turns solid once the visitor scrolls.
 */
export function Header() {
  const pathname = usePathname();
  const overHero = pathname === "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(!overHero);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!overHero) {
      setScrolled(true);
      return;
    }
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [overHero]);

  const solid = scrolled || open;
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <header
      className={cn(
        "z-50 transition-[background-color,border-color,box-shadow] duration-200",
        overHero ? "fixed inset-x-0 top-0" : "sticky top-0",
        solid ? "border-b border-line bg-canvas/95 shadow-1 backdrop-blur" : "border-b border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-6 px-4 sm:px-6">
        <Link href="/" aria-label="EduFlow home" className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
          <Logo tone={solid ? "dark" : "light"} />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative rounded-md px-3 py-2 text-[15px] font-medium transition-colors focus-visible:outline-none focus-visible:shadow-focus",
                  solid ? (active ? "text-primary" : "text-ink-2 hover:text-ink") : "text-white/85 hover:text-white"
                )}
              >
                {link.name}
                {active && <span aria-hidden className="absolute inset-x-3 -bottom-[13px] h-[2px] bg-primary" />}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(
              "press inline-flex h-10 items-center rounded-md px-4 text-[15px] font-medium focus-visible:outline-none focus-visible:shadow-focus",
              solid ? "text-ink hover:bg-surface-sunken" : "text-white hover:bg-white/10"
            )}
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className={cn(
              "press inline-flex h-10 items-center rounded-md px-4 text-[15px] font-medium focus-visible:outline-none focus-visible:shadow-focus",
              solid ? "bg-primary text-white hover:bg-primary-hover" : "bg-white text-primary hover:bg-canvas"
            )}
          >
            Start free trial
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className={cn(
            "press inline-flex h-10 w-10 items-center justify-center rounded-md md:hidden focus-visible:outline-none focus-visible:shadow-focus",
            solid ? "text-ink hover:bg-surface-sunken" : "text-white hover:bg-white/10"
          )}
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-line bg-canvas px-4 pb-6 pt-3 duration-200 animate-in fade-in slide-in-from-top-1 md:hidden">
          <nav aria-label="Main mobile" className="flex flex-col">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex h-12 items-center border-b border-line text-[17px] font-medium",
                  isActive(link.href) ? "text-primary" : "text-ink"
                )}
              >
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/login"
              className="press inline-flex h-11 items-center justify-center rounded-md border border-line-strong bg-surface text-[15px] font-medium text-ink"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="press inline-flex h-11 items-center justify-center rounded-md bg-primary text-[15px] font-medium text-white"
            >
              Start free trial
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
