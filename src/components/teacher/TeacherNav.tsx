"use client";

import { LayoutDashboard, ClipboardCheck, FileCheck2, FileSpreadsheet, Sparkles } from "@/components/icons";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/teacher", label: "Today", icon: LayoutDashboard, exact: true },
  { href: "/teacher/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/teacher/marking", label: "Marking queue", icon: FileCheck2 },
  { href: "/teacher/tests", label: "Tests & marks", icon: FileSpreadsheet },
  { href: "/teacher/tests/generate", label: "Paper generator", icon: Sparkles },
];

interface TeacherNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function TeacherNav({ user }: TeacherNavProps) {
  return (
    <SidebarNav
      items={navItems}
      roleLabel="Teacher"
      sectionLabel="Classroom"
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
