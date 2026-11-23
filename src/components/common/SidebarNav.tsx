"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ChevronDown, KeyRound, LogOut, Menu, X, type LucideIcon } from "@/components/icons";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/brand/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact match only (e.g. a dashboard root) */
  exact?: boolean;
  /** Never shown as active (e.g. cross-portal links) */
  neverActive?: boolean;
}

interface SidebarNavProps {
  items: SidebarNavItem[];
  /** e.g. "Admin", "Teacher" */
  roleLabel: string;
  /** Section heading above the links */
  sectionLabel?: string;
  /** Person or academy the session belongs to */
  identity?: { primary?: string | null; secondary?: string | null };
  changePasswordHref?: string;
}

function initials(s?: string | null) {
  if (!s) return "EF";
  return s
    .split(/[\s@.-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

/**
 * The midnight-ink sidebar shared by every portal.
 * ≥1024px: fixed 264px column. <1024px: slim top bar + slide-in drawer.
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
    const matches = items
      .filter((i) => !i.neverActive && (pathname === i.href || pathname.startsWith(i.href + "/")))
      .sort((a, b) => b.href.length - a.href.length);
    return matches[0]?.href === item.href;
  };

  const links = (onNavigate?: () => void) => (
    <nav aria-label={`${roleLabel} navigation`} className="flex-1 overflow-y-auto px-3 pb-4">
      <p className="px-3 pb-2 pt-1 text-[12px] font-medium text-sidebar-ink-2/80">{sectionLabel}</p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <li key={item.href + item.label}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-[background-color,color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "bg-white/[0.08] text-white shadow-[inset_0_1px_0_rgba(255,255,255,.06)]"
                    : "text-sidebar-ink-2 hover:bg-white/[0.04] hover:text-sidebar-ink"
                )}
              >
                {active && (
                  <span
                    aria-hidden
                    className="absolute -left-3 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-greenboard-400 shadow-[0_0_12px_2px_rgba(115,135,242,.6)]"
                  />
                )}
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0 transition-colors",
                    active ? "text-greenboard-300" : "text-sidebar-ink-2 group-hover:text-sidebar-ink"
                  )}
                  strokeWidth={1.8}
                />
                <span className="truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );

  const userMenu = (
    <div className="border-t border-white/[0.06] p-3">
      <DropdownMenu>
        <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-greenboard-400 to-greenboard-700 text-[13px] font-bold text-white ring-2 ring-white/10">
            {initials(identity?.primary)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-white">{identity?.primary || roleLabel}</span>
            <span className="block truncate text-[12px] text-sidebar-ink-2">{identity?.secondary || roleLabel}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-ink-2" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="start" className="w-[232px]">
          <DropdownMenuLabel>Signed in as {roleLabel.toLowerCase()}</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={changePasswordHref}>
              <KeyRound /> Change password
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem tone="danger" onSelect={() => signOut({ callbackUrl: "/login" })}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const brand = (
    <div className="px-4 pb-4 pt-5">
      <Link
        href={items[0]?.href ?? "/"}
        className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
      >
        <LogoMark className="h-8 w-8" />
        <span className="font-serif text-[19px] font-bold tracking-[-0.02em] text-white">EduFlow</span>
        <span className="ml-auto rounded-full bg-white/[0.08] px-2 py-0.5 text-[11.5px] font-semibold text-sidebar-ink">
          {roleLabel}
        </span>
      </Link>
    </div>
  );

  const shell = "relative flex flex-col overflow-hidden bg-sidebar";
  const glow = (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[140%] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(74,98,232,.35),transparent)]"
    />
  );

  return (
    <>
      {/* Phone & tablet top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-sidebar px-4 lg:hidden">
        <Link
          href={items[0]?.href ?? "/"}
          className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <LogoMark className="h-7 w-7" />
          <span className="font-serif text-[17px] font-bold text-white">EduFlow</span>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-[11px] font-semibold text-sidebar-ink">{roleLabel}</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-expanded={open}
          aria-label="Open navigation"
          className="press inline-flex h-10 w-10 items-center justify-center rounded-xl text-white hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Drawer */}
      {open && (
        <div className="fixed inset-0 z-50 flex lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm duration-200 animate-in fade-in"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div className={cn(shell, "h-full w-[288px] max-w-[85vw] shadow-3 duration-300 ease-drawer animate-in slide-in-from-left")}>
            {glow}
            <div className="relative flex items-center justify-between pr-3">
              <div className="flex-1">{brand}</div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-sidebar-ink-2 hover:bg-white/[0.06] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              {links(() => setOpen(false))}
              {userMenu}
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn(shell, "sticky top-0 z-30 hidden h-screen w-[264px] shrink-0 lg:flex")}>
        {glow}
        <div className="relative flex min-h-0 flex-1 flex-col">
          {brand}
          {links()}
          {userMenu}
        </div>
      </aside>
    </>
  );
}
