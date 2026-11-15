"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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
  ShieldAlert,
  Settings,
  KeyRound,
  Menu,
  X,
  ChevronDown,
} from "lucide-react";
import { signOut } from "next-auth/react";

const primaryNavItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/classes", label: "Classes", icon: School },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/admin/fees", label: "Fees", icon: Banknote },
  { href: "/admin/results", label: "Results", icon: Award },
];

const secondaryNavItems = [
  { href: "/admin/salaries", label: "Salaries", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const allNavItems = [...primaryNavItems, ...secondaryNavItems];

interface AdminNavProps {
  academySlug?: string | null;
  role?: string | null;
}

export function AdminNav({ academySlug, role }: AdminNavProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isSecondaryActive = secondaryNavItems.some((item) =>
    pathname.startsWith(item.href)
  );

  return (
    <header className="border-b bg-white sticky top-0 z-40 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo & Academy badge */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <Link
              href="/admin"
              className="text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap"
              onClick={() => setMobileMenuOpen(false)}
            >
              EduFlow
            </Link>
            {academySlug && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                {academySlug}
              </span>
            )}
          </div>

          {/* Desktop Navigation (>= 1280px / xl) */}
          <nav className="hidden xl:flex items-center space-x-1">
            {role === "SUPER_ADMIN" && (
              <Link
                href="/superadmin"
                className={cn(
                  "flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap",
                  pathname.startsWith("/superadmin")
                    ? "bg-purple-900 text-white"
                    : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                )}
              >
                <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                <span>Super Admin</span>
              </Link>
            )}

            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            {/* "More" Dropdown for Salaries, Reports, Settings */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className={cn(
                  "flex items-center space-x-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap",
                  isSecondaryActive
                    ? "bg-slate-900 text-white"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                )}
              >
                <span>More</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-1 w-44 bg-white border rounded-lg shadow-lg py-1 z-50">
                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-2 text-xs font-medium transition-colors",
                          isActive
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                        )}
                      >
                        <Icon className="h-4 w-4 shrink-0 text-slate-500" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Desktop Right actions */}
          <div className="hidden xl:flex items-center space-x-2 shrink-0">
            <Link href="/admin/change-password">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900 text-xs whitespace-nowrap"
              >
                <KeyRound className="h-3.5 w-3.5 mr-1" />
                Password
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-slate-600 hover:text-red-600 text-xs whitespace-nowrap"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Sign Out
            </Button>
          </div>

          {/* Mobile & Tablet Toggle Button (< 1280px) */}
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

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-t bg-white shadow-lg px-4 py-4 space-y-1 max-h-[calc(100vh-4rem)] overflow-y-auto">
          {academySlug && (
            <div className="sm:hidden px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-md border border-emerald-100 mb-2">
              Academy: {academySlug}
            </div>
          )}

          {role === "SUPER_ADMIN" && (
            <Link
              href="/superadmin"
              onClick={() => setMobileMenuOpen(false)}
              className={cn(
                "flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors",
                pathname.startsWith("/superadmin")
                  ? "bg-purple-900 text-white"
                  : "text-purple-700 bg-purple-50 hover:bg-purple-100"
              )}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>Super Admin Platform</span>
            </Link>
          )}

          {allNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));
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
              href="/admin/change-password"
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
