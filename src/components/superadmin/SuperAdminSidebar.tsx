"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  LayoutDashboard,
  Building2,
  CreditCard,
  ExternalLink,
  LogOut,
  KeyRound,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { signOut } from "next-auth/react";

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

  const navItems = [
    {
      href: "/superadmin",
      label: "Dashboard",
      icon: LayoutDashboard,
      active: pathname === "/superadmin",
    },
    {
      href: "/superadmin#academies",
      label: "Academies",
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
      label: "Admin Portal",
      icon: ExternalLink,
      active: false,
      external: true,
    },
  ];

  return (
    <>
      {/* Mobile Top Header (< 768px) */}
      <div className="md:hidden flex items-center justify-between px-4 h-16 bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="h-6 w-6 text-purple-400" />
          <span className="font-bold text-lg tracking-tight">EduFlow</span>
          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-300 border border-purple-700/60">
            Super Admin
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu (< 768px) */}
      {mobileOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-3 space-y-2 sticky top-16 z-30">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors",
                    item.active
                      ? "bg-purple-600 text-white font-semibold"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span className="truncate max-w-[180px]">{user?.email || "Super Admin"}</span>
            <div className="flex items-center space-x-1">
              <Link href="/change-password" onClick={() => setMobileOpen(false)}>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-300">
                  Password
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="h-7 text-xs text-rose-400 hover:text-rose-300"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Desktop / Tablet Sidebar (>= 768px: visible at both 768px and 1440px) */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 shrink-0 min-h-screen sticky top-0 h-screen">
        {/* Brand & Badge */}
        <div className="p-5 border-b border-slate-800/80">
          <div className="flex items-center space-x-2.5">
            <div className="h-9 w-9 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-bold text-base text-white tracking-tight flex items-center space-x-1.5">
                <span>EduFlow</span>
              </div>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-900/80 text-purple-300 border border-purple-700/60 font-mono">
                  Super Admin
                </span>
                <span className="text-[11px] text-slate-400">Platform</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2">
            Navigation
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all group",
                  item.active
                    ? "bg-purple-600 text-white font-semibold shadow-sm shadow-purple-900/40"
                    : "text-slate-300 hover:text-white hover:bg-slate-800/70"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-transform group-hover:scale-105",
                    item.active ? "text-white" : "text-slate-400 group-hover:text-purple-400"
                  )}
                />
                <span className="flex-1">{item.label}</span>
                {item.external && (
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                    Switch
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-6">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-3 mb-2">
              Platform Overview
            </div>
            <div className="px-3 py-2.5 rounded-lg bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Multi-tenant SaaS</span>
                <span className="text-emerald-400 font-semibold flex items-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
                  Active
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                14-day trials & automated billing engine active
              </div>
            </div>
          </div>
        </div>

        {/* User Card & Action Footer */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/90 space-y-2">
          <div className="px-3 py-2 rounded-lg bg-slate-800/40 border border-slate-800">
            <div className="text-[11px] font-semibold text-slate-200 truncate">
              {user?.name || "Platform Owner"}
            </div>
            <div className="text-[10px] text-slate-400 font-mono truncate">
              {user?.email || "superadmin@eduflow.test"}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <Link href="/change-password" className="w-full">
              <Button
                variant="outline"
                size="sm"
                className="w-full h-8 text-[11px] bg-slate-800/60 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <KeyRound className="h-3 w-3 mr-1" />
                Password
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full h-8 text-[11px] bg-slate-800/60 border-slate-700 text-rose-300 hover:text-rose-100 hover:bg-rose-900/40 hover:border-rose-700"
            >
              <LogOut className="h-3 w-3 mr-1" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
