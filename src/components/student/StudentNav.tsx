"use client";

import { LayoutDashboard, QrCode } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/student", label: "My dashboard", icon: LayoutDashboard, exact: true },
  { href: "/student/attendance/scan", label: "Scan attendance QR", icon: QrCode },
];

interface StudentNavProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function StudentNav({ user }: StudentNavProps) {
  return (
    <SidebarNav
      items={navItems}
      roleLabel="Student"
      sectionLabel="Learning"
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
