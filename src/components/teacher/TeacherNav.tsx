"use client";

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

  return (
    <header className="border-b bg-white sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Link href="/teacher" className="text-xl font-bold tracking-tight text-slate-900">
                EduFlow
              </Link>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <GraduationCap className="h-3.5 w-3.5 mr-1" />
                Teacher
              </span>
            </div>
            <nav className="flex space-x-1 sm:space-x-2">
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
                      "flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center space-x-2">
            {user?.name && (
              <span className="hidden lg:inline-block text-xs font-medium text-slate-500 mr-2">
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
                <span className="hidden sm:inline">Password</span>
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
