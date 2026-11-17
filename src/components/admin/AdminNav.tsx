"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  GraduationCap,
  School,
  LayoutDashboard,
  LogOut,
  Calendar,
  CheckCircle2,
  Banknote,
  Award,
  Wallet,
  FileSpreadsheet,
  Settings,
  KeyRound,
  ChevronRight,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { AnimatedMenuButton } from "@/components/common/AnimatedMenuButton";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/classes", label: "Classes & Batches", icon: School },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/admin/fees", label: "Fee Management", icon: Banknote },
  { href: "/admin/results", label: "Exams & Results", icon: Award },
  { href: "/admin/salaries", label: "Faculty Payroll", icon: Wallet },
  { href: "/admin/reports", label: "Export Reports", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Academy Settings", icon: Settings },
];

interface AdminNavProps {
  academySlug?: string | null;
  role?: string | null;
}

export function AdminNav({ academySlug, role }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close drawer on path change or escape key
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

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      {/* ── Mobile Top Header (< 768px) ── */}
      <header className="md:hidden flex items-center justify-between px-4 h-16 bg-[#0F2040] text-white sticky top-0 z-40 shadow-md border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="h-9 w-9 rounded-xl bg-[#F5B800] flex items-center justify-center shadow-sm">
            <LayoutDashboard className="h-5 w-5 text-[#0F2040]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-white">EduFlow</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                Admin
              </span>
            </div>
            {academySlug && (
              <span className="text-[10px] text-slate-300 font-medium truncate block max-w-[140px]">
                {academySlug}
              </span>
            )}
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

          {/* Morphing Hamburger Menu Button */}
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
          {/* Backdrop Blur */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-[#0F2040] text-white min-h-screen flex flex-col justify-between shadow-2xl z-10 border-r border-white/10 animate-in slide-in-from-left duration-300 ease-out">
            {/* Drawer Top / Brand */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="h-9 w-9 rounded-xl bg-[#F5B800] flex items-center justify-center shadow-md">
                  <LayoutDashboard className="h-5 w-5 text-[#0F2040]" />
                </div>
                <div>
                  <div className="font-extrabold text-base text-white tracking-tight">EduFlow</div>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                    Academy Admin
                  </span>
                </div>
              </div>
              <AnimatedMenuButton
                isOpen={mobileOpen}
                onClick={() => setMobileOpen(false)}
                ariaLabel="Close Menu"
              />
            </div>

            {/* Staggered Navigation Items */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2">
                Main Menu
              </div>
              {navItems.map((item, idx) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={{ animationDelay: `${idx * 30}ms` }}
                    className={cn(
                      "animate-stagger-item flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2040]",
                      active
                        ? "bg-[#F5B800] text-[#0F2040] font-bold shadow-md shadow-[#F5B800]/20"
                        : "text-slate-200 hover:text-white hover:bg-white/[0.08]"
                    )}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                          active ? "text-[#0F2040]" : "text-slate-300"
                        )}
                      />
                      <span>{item.label}</span>
                    </div>
                    {active && <ChevronRight className="h-3.5 w-3.5 text-[#0F2040]" />}
                  </Link>
                );
              })}
            </nav>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-white/10 space-y-1.5 bg-[#0B1730]">
              <Link
                href="/admin/change-password"
                onClick={() => setMobileOpen(false)}
                className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
              >
                <KeyRound className="h-4 w-4 text-slate-300" />
                <span>Change Password</span>
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Persistent Desktop Midnight Navy Sidebar (≥ 768px) ── */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0F2040] text-white shrink-0 min-h-screen sticky top-0 h-screen shadow-xl border-r border-white/10 z-30">
        {/* Brand Header */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-xl bg-[#F5B800] flex items-center justify-center shrink-0 shadow-md">
              <LayoutDashboard className="h-5 w-5 text-[#0F2040]" />
            </div>
            <div className="min-w-0">
              <div className="font-extrabold text-base text-white tracking-tight flex items-center gap-1.5">
                <span>EduFlow</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F5B800]" />
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#F5B800] text-[#0F2040]">
                  Admin
                </span>
                {academySlug && (
                  <span className="text-[10px] text-slate-300 font-medium truncate max-w-[100px]">
                    {academySlug}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2.5">
            Academy Control
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2040]",
                  active
                    ? "bg-[#F5B800] text-[#0F2040] font-bold shadow-md shadow-[#F5B800]/20"
                    : "text-slate-200 hover:text-white hover:bg-white/[0.08]"
                )}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform group-hover:scale-110",
                      active ? "text-[#0F2040]" : "text-slate-300"
                    )}
                  />
                  <span>{item.label}</span>
                </div>
                {active && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F2040]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer — user actions */}
        <div className="p-3 border-t border-white/10 space-y-1.5 bg-[#0B1730]">
          <Link
            href="/admin/change-password"
            className="flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:text-white hover:bg-white/[0.08] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800]"
          >
            <KeyRound className="h-4 w-4 shrink-0 text-slate-300" />
            <span>Change Password</span>
          </Link>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-medium text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
