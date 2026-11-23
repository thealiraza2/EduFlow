"use client";

import { Inbox, LayoutDashboard, Library, Megaphone, PlusCircle, ArrowUpRight } from "@/components/icons";
import { SidebarNav, type SidebarNavItem } from "@/components/common/SidebarNav";

const navItems: SidebarNavItem[] = [
  { href: "/superadmin", label: "Academies & stats", icon: LayoutDashboard },
  { href: "/superadmin/academies/new", label: "New academy", icon: PlusCircle },
  { href: "/superadmin/bank", label: "Question bank", icon: Library },
  { href: "/superadmin/inbox", label: "Inbox", icon: Inbox },
  { href: "/superadmin/announcements", label: "Announcements", icon: Megaphone },
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
      sectionLabel="Platform console"
      identity={{ primary: user?.name, secondary: user?.email }}
    />
  );
}
