"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  CreditCard,
  ExternalLink,
  LogOut,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { AnimatedMenuButton } from "@/components/common/AnimatedMenuButton";

interface SuperAdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen]);

  const navItems = [
    {
      href: "/superadmin",
      label: "Platform Overview",
      icon: LayoutDashboard,
      active: pathname === "/superadmin",
    },
    {
      href: "/superadmin#academies",
      label: "Academies Directory",
      icon: Building2,
      active: false,
    },
    {
      href: "/superadmin#plans",
      label: "Plans & Billing",
      icon: CreditCard,
      active: false,
    },
    {
      href: "/admin",
      label: "Academy Admin View",
      icon: ExternalLink,
      active: false,
      external: true,
    },
  ];

  return (
    <>
      {/* ── Mobile Top Bar (< 768px) ── */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-[#0F2040] text-white sticky top-0 z-40 shadow-md border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#F5B800] flex items-center justify-center shadow-sm">
            <ShieldCheck className="h-5 w-5 text-[#0F2040]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">EduFlow</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                Super Admin
              </span>
            </div>
            <span className="text-[10px] text-slate-300 font-medium">SaaS Platform Root</span>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-2 rounded-xl text-slate-300 hover:text-red-400 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
            title="Sign Out"
            aria-label="Sign Out"
          >
            <LogOut className="h-4 w-4" />
          </button>
          <AnimatedMenuButton
            isOpen={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
            ariaLabel="Toggle Navigation Drawer"
          />
        </div>
      </header>

      {/* ── Mobile Slide-in Drawer with Backdrop (< 768px) ── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          <div className="relative w-72 max-w-[85vw] bg-[#0F2040] text-white min-h-screen flex flex-col justify-between shadow-2xl z-10 border-r border-white/10 animate-in slide-in-from-left duration-300 ease-out">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-[#F5B800] flex items-center justify-center shadow-md">
                  <ShieldCheck className="h-5 w-5 text-[#0F2040]" />
                </div>
                <div>
                  <div className="font-extrabold text-base text-white tracking-tight">EduFlow</div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                    Super Admin
                  </span>
                </div>
              </div>
              <AnimatedMenuButton
                isOpen={mobileOpen}
                onClick={() => setMobileOpen(false)}
                ariaLabel="Close Menu"
              />
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2">
                Platform Navigation
              </div>
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    className={cn(
                      "animate-stagger-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2040]",
                      item.active
                        ? "bg-[#F5B800] text-[#0F2040] font-bold shadow-md shadow-[#F5B800]/20"
                        : "text-slate-200 hover:text-white hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                          item.active ? "text-[#0F2040]" : "text-slate-300"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {item.external && (
                      <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                        Switch
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-white/10 space-y-2 bg-[#0B1730]">
              <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                <div className="text-xs font-semibold text-white truncate">
                  {user?.name || "Platform Owner"}
                </div>
                <div className="text-[10px] text-slate-300 font-mono truncate">
                  {user?.email || "superadmin@eduflow.test"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/change-password"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
                >
                  <KeyRound className="h-3.5 w-3.5 text-slate-300" />
                  <span>Password</span>
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Desktop Midnight Navy Sidebar (≥ 768px) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F2040] text-white shrink-0 min-h-screen sticky top-0 h-screen shadow-xl border-r border-white/10 z-30">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#F5B800] flex items-center justify-center shrink-0 shadow-md">
              <ShieldCheck className="h-5 w-5 text-[#0F2040]" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                <span>EduFlow</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B800]" />
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                  Super Admin
                </span>
                <span className="text-[11px] text-slate-300">Root</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2.5">
            Platform Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2040]",
                  item.active
                    ? "bg-[#F5B800] text-[#0F2040] font-bold shadow-md shadow-[#F5B800]/20"
                    : "text-slate-200 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      item.active ? "text-[#0F2040]" : "text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {item.external ? (
                  <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-1.5 py-0.5 rounded border border-white/10">
                    Switch
                  </span>
                ) : item.active ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F2040]" />
                ) : null}
              </Link>
            );
          })}

          <div className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2">
              Platform Status
            </div>
            <div className="px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Multi-tenant SaaS</span>
                <span className="text-emerald-400 font-bold flex items-center text-[11px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block mr-1.5 animate-pulse" />
                  Active
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-relaxed">
                Automated billing, 14-day trials, & Supabase cloud DB online
              </div>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-white/10 space-y-2 bg-[#0B1730]">
          <div className="px-3 py-2 rounded-xl bg-white/5 border border-white/10">
            <div className="text-xs font-semibold text-white truncate">
              {user?.name || "Platform Owner"}
            </div>
            <div className="text-[10px] text-slate-300 font-mono truncate">
              {user?.email || "superadmin@eduflow.test"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Link
              href="/change-password"
              className="flex items-center justify-center space-x-1 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
            >
              <KeyRound className="h-3.5 w-3.5 text-slate-300" />
              <span>Password</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center justify-center space-x-1 px-2.5 py-2 rounded-xl text-xs font-medium text-red-300 bg-red-500/10 hover:bg-red-500/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
