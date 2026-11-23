"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { KeyRound, LogOut, Menu, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/brand/Logo";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (e.g. a dashboard root) */
  exact?: boolean;
  /** Never shown as active (e.g. in-page anchors, cross-portal links) */
  neverActive?: boolean;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  /** e.g. "Academy admin", "Teacher" */
  roleLabel: string;
  /** Section heading above the links */
  sectionLabel?: string;
  /** Person or academy the session belongs to */
  identity?: { primary?: string | null; secondary?: string | null };
  changePasswordHref?: string;
}

/**
 * The greenboard sidebar shared by all five dashboards (DESIGN.md §2, §4.2, §5).
 * ≥1024px: fixed 248px column. <1024px: 56px top bar + slide-in drawer.
 */
export function SidebarNav({
  items,
  roleLabel,
  sectionLabel = "Menu",
  identity,
  changePasswordHref = "/change-password",
}: SidebarNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isActive = (item: SidebarNavItem) => {
    if (item.neverActive) return false;
    if (item.exact) return pathname === item.href;
    // Longest-prefix wins so "/teacher/tests/generate" does not also light up "/teacher/tests"
    const matches = items
      .filter((i) => !i.neverActive && (pathname === i.href || pathname.startsWith(i.href + "/")))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href === item.href;
  };

  const links = (onNavigate?: () => void, stagger = false) => (
    <nav aria-label={`${roleLabel} navigation`} className="flex-1 overflow-y-auto px-3 py-4">
      <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-[0.1em] text-sidebar-ink-2">
        {sectionLabel}
      </p>
      <ul className="space-y-0.5">
        {items.map((item, idx) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                style={stagger ? { animationDelay: `${idx * 40}ms` } : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-md px-3 text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink/60",
                  stagger && "animate-stagger-item",
                  active
                    ? "bg-sidebar-active text-sidebar-ink"
                    : "text-sidebar-ink-2 hover:bg-white/[0.05] hover:text-sidebar-ink"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-greenboard-300 transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const footer = (onNavigate?: () => void) => (
    <div className="border-t border-white/[0.08] p-3">
      {identity?.primary && (
        <div className="mb-2 px-3 py-2">
          <p className="truncate text-[14px] font-medium text-sidebar-ink">{identity.primary}</p>
          {identity.secondary && (
            <p className="truncate text-[12px] text-sidebar-ink-2">{identity.secondary}</p>
          )}
        </div>
      )}
      <Link
        href={changePasswordHref}
        onClick={onNavigate}
        className="flex h-9 items-center gap-3 rounded-md px-3 text-[13px] font-medium text-sidebar-ink-2 transition-colors hover:bg-white/[0.05] hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink/60"
      >
        <KeyRound className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        Change password
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-left text-[13px] font-medium text-sidebar-ink-2 transition-colors hover:bg-white/[0.05] hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink/60"
      >
        <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        Sign out
      </button>
    </div>
  );

  const brand = (
    <div className="flex h-16 items-center justify-between gap-2 border-b border-white/[0.08] px-5">
      <Link href={items[0]?.href ?? "/"} className="rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink/60">
        <Logo tone="light" />
      </Link>
      <span className="rounded-sm bg-white/[0.08] px-2 py-0.5 text-xs font-semibold text-sidebar-ink-2">
        {roleLabel}
      </span>
    </div>
  );

  return (
    <>
      {/* Mobile / tablet top bar (<1024px) */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-line bg-surface/95 px-4 backdrop-blur lg:hidden">
        <Link href={items[0]?.href ?? "/"} className="rounded-md focus-visible:outline-none focus-visible:shadow-focus">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-sm bg-primary-tint px-2 py-0.5 text-xs font-semibold text-primary sm:inline">
            {roleLabel}
          </span>
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-label="Open navigation"
            className="press inline-flex h-10 w-10 items-center justify-center rounded-md text-ink hover:bg-surface-sunken focus-visible:outline-none focus-visible:shadow-focus"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      {/* Drawer (<1024px) */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-ink/50 duration-200 animate-in fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className="relative flex h-full w-[280px] max-w-[85vw] flex-col bg-sidebar shadow-3 duration-300 ease-drawer animate-in slide-in-from-left">
            <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-5">
              <Logo tone="light" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="press inline-flex h-10 w-10 items-center justify-center rounded-md text-sidebar-ink-2 hover:bg-white/[0.06] hover:text-sidebar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ink/60"
              >
                <X className="h-5 w-5" strokeWidth={1.75} />
              </button>
            </div>
            <p className="px-6 pt-4 text-[12px] font-semibold text-sidebar-ink-2">{roleLabel}</p>
            {links(() => setOpen(false), true)}
            {footer(() => setOpen(false))}
          </div>
        </div>
      )}

      {/* Desktop sidebar (≥1024px) */}
      <aside className="sticky top-0 z-30 hidden h-screen w-[248px] shrink-0 flex-col bg-sidebar lg:flex">
        {brand}
        {links()}
        {footer()}
      </aside>
    </>
  );
}
