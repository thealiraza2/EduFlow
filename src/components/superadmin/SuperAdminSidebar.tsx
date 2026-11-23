"use client";

import { LayoutDashboard, Building2, CreditCard, ArrowUpRight } from "lucide-react";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/superadmin", label: "Platform overview", icon: LayoutDashboard, exact: true },
  { href: "/superadmin#academies", label: "Academies", icon: Building2, neverActive: true },
  { href: "/superadmin#plans", label: "Plans & billing", icon: CreditCard, neverActive: true },
  { href: "/admin", label: "Open admin view", icon: ArrowUpRight, neverActive: true },
];

interface SuperAdminSidebarProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

export function SuperAdminSidebar({ user }: SuperAdminSidebarProps) {
  return (
    <SidebarNav
      items={navItems}
      roleLabel="Platform"
      sectionLabel="Platform"
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
