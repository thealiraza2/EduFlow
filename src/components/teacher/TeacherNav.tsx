"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CheckCircle2,
  FileCheck2,
  FileSpreadsheet,
  Sparkles,
  LogOut,
  KeyRound,
  GraduationCap,
  Menu,
  X,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/teacher", label: "Dashboard", icon: LayoutDashboard },
  { href: "/teacher/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/teacher/marking", label: "Marking Queue", icon: FileCheck2 },
  { href: "/teacher/tests", label: "Tests", icon: FileSpreadsheet },
  { href: "/teacher/tests/generate", label: "AI Generator", icon: Sparkles },
];

interface TeacherNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function TeacherNav({ user }: TeacherNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b bg-white sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3 sm:space-x-6">
            <div className="flex items-center space-x-2">
              <Link
                href="/teacher"
                className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
                onClick={() => setMobileMenuOpen(false)}
              >
                EduFlow
              </Link>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                Teacher
              </span>
            </div>

            {/* Desktop Nav (>= 1280px / xl) */}
            <nav className="hidden xl:flex space-x-1 sm:space-x-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === "/teacher"
                    ? pathname === "/teacher"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Desktop Right Actions (>= 1280px / xl) */}
          <div className="hidden xl:flex items-center space-x-2">
            {user?.name && (
              <span className="hidden lg:inline-block text-xs font-medium text-slate-500 mr-2 whitespace-nowrap">
                {user.name}
              </span>
            )}
            <Link href="/change-password">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                <KeyRound className="h-4 w-4 mr-1.5" />
                <span>Password</span>
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-slate-600 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign Out
            </Button>
          </div>

          {/* Mobile & Tablet Toggle (< 1280px / xl) */}
          <div className="flex xl:hidden items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-slate-600 hover:text-red-600 text-xs px-2"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t bg-white shadow-lg px-4 py-4 space-y-1">
          {user?.name && (
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 bg-slate-50 rounded-md mb-2">
              Logged in as {user.name}
            </div>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/teacher"
                ? pathname === "/teacher"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-3 mt-3 border-t border-slate-100 space-y-1">
            <Link
              href="/change-password"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <KeyRound className="h-4 w-4" />
              <span>Change Password</span>
            </Link>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
