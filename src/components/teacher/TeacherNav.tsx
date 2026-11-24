"use client";

import { LayoutDashboard, ClipboardCheck, FileCheck2, FileSpreadsheet, Sparkles, ArrowLeft } from "@/components/icons";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const teacherItems: SidebarNavItem[] = [
  { href: "/teacher", label: "Today", icon: LayoutDashboard, exact: true },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/marking", label: "Marking queue", icon: FileCheck2 },
  { href: "/teacher/tests", label: "Tests & marks", icon: FileSpreadsheet },
  { href: "/teacher/papers", label: "Paper generator", icon: Sparkles },
];

const backToAdmin: SidebarNavItem = { href: "/admin", label: "Back to admin", icon: ArrowLeft, exact: true };
// Admins keep the classroom pages and gain a way back to the admin panel.
const adminItems: SidebarNavItem[] = [backToAdmin, ...teacherItems];
// Super admins only come here for the paper generator; the classroom pages
// need a teacher or admin of the academy.
const superAdminItems: SidebarNavItem[] = [backToAdmin, { href: "/teacher/papers", label: "Paper generator", icon: Sparkles }];

interface TeacherNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function TeacherNav({ user }: TeacherNavProps) {
  const role = user?.role;
  return (
    <SidebarNav
      items={role === "SUPER_ADMIN" ? superAdminItems : role === "ADMIN" ? adminItems : teacherItems}
      roleLabel={role === "SUPER_ADMIN" ? "Super admin" : role === "ADMIN" ? "Admin" : "Teacher"}
      sectionLabel={role === "SUPER_ADMIN" ? "Papers" : "Classroom"}
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
