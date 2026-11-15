"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  variant?: "ghost" | "outline" | "default" | "destructive" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export function SignOutButton({
  className = "text-slate-600 hover:text-red-600",
  variant = "ghost",
  size = "sm",
}: SignOutButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={className}
    >
      <LogOut className="h-4 w-4 mr-1.5" />
      Sign Out
    </Button>
  );
}
