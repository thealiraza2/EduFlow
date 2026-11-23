"use client";

import { LayoutDashboard, CalendarDays } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/parent", label: "My children", icon: LayoutDashboard, exact: true },
  { href: "/parent/timetable", label: "Timetable", icon: CalendarDays },
];

interface ParentNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function ParentNav({ user }: ParentNavProps) {
  return (
    <SidebarNav
      items={navItems}
      roleLabel="Parent"
      sectionLabel="Family"
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
