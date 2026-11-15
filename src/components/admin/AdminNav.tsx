"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Users, GraduationCap, School, LayoutDashboard, LogOut, Calendar, CheckCircle2, Banknote, Award, Wallet, FileSpreadsheet, ShieldAlert, Settings, KeyRound } from "lucide-react";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/classes", label: "Classes & Batches", icon: School },
  { href: "/admin/timetable", label: "Timetable", icon: Calendar },
  { href: "/admin/attendance", label: "Attendance", icon: CheckCircle2 },
  { href: "/admin/fees", label: "Fees", icon: Banknote },
  { href: "/admin/salaries", label: "Salaries", icon: Wallet },
  { href: "/admin/results", label: "Results", icon: Award },
  { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminNavProps {
  academySlug?: string | null;
  role?: string | null;
}

export function AdminNav({ academySlug, role }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <header className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <Link href="/admin" className="text-xl font-bold tracking-tight text-slate-900">
                EduFlow
              </Link>
              {academySlug && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {academySlug}
                </span>
              )}
            </div>
            <nav className="flex space-x-2">
              {role === "SUPER_ADMIN" && (
                <Link
                  href="/superadmin"
                  className={cn(
                    "flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-semibold transition-colors",
                    pathname.startsWith("/superadmin")
                      ? "bg-purple-900 text-white"
                      : "text-purple-700 bg-purple-50 hover:bg-purple-100"
                  )}
                >
                  <ShieldAlert className="h-4 w-4" />
                  <span>Super Admin</span>
                </Link>
              )}
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
          <div className="flex items-center space-x-2">
            <Link href="/admin/change-password">
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-600 hover:text-slate-900"
              >
                <KeyRound className="h-4 w-4 mr-1.5" />
                Password
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
        </div>
      </div>
    </header>
  );
}
