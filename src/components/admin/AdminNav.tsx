"use client";

import {
  Users,
  GraduationCap,
  School,
  LayoutDashboard,
  CalendarDays,
  ClipboardCheck,
  Banknote,
  Award,
  Wallet,
  FileSpreadsheet,
  Settings,
  BookOpenCheck,
  ShieldCheck,
} from "@/components/icons";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/teachers", label: "Teachers", icon: GraduationCap },
  { href: "/admin/classes", label: "Classes & batches", icon: School },
  { href: "/admin/timetable", label: "Timetable", icon: CalendarDays },
  { href: "/admin/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/admin/fees", label: "Fees", icon: Banknote },
  { href: "/admin/results", label: "Exams & results", icon: Award },
  { href: "/teacher/papers", label: "Paper generator", icon: BookOpenCheck },
  { href: "/admin/salaries", label: "Payroll", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: FileSpreadsheet },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

interface AdminNavProps {
  academySlug?: string | null;
  role?: string | null;
}

const superAdminItem: SidebarNavItem = {
  href: "/superadmin",
  label: "Platform console",
  icon: ShieldCheck,
  neverActive: true,
};

export function AdminNav({ academySlug, role }: AdminNavProps) {
  const isSuperAdmin = role === "SUPER_ADMIN";
  return (
    <SidebarNav
      items={isSuperAdmin ? [superAdminItem, ...navItems] : navItems}
      roleLabel={role === "SUPER_ADMIN" ? "Super admin" : "Admin"}
      sectionLabel="Academy"
      identity={academySlug ? { primary: academySlug, secondary: "Academy workspace" } : undefined}
      changePasswordHref="/admin/change-password"
    />
  );
}
