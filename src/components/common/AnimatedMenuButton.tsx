"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface AnimatedMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export function AnimatedMenuButton({
  isOpen,
  onClick,
  className,
  ariaLabel = "Toggle navigation menu",
}: AnimatedMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={ariaLabel}
      className={cn(
        "relative w-10 h-10 rounded-xl flex flex-col items-center justify-center gap-1.5",
        "text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B800] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F2040]",
        className
      )}
    >
      {/* Top Bar */}
      <span
        className={cn(
          "w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center",
          isOpen && "translate-y-2 rotate-45"
        )}
      />
      {/* Middle Bar */}
      <span
        className={cn(
          "w-5 h-0.5 bg-current rounded-full transition-all duration-200 ease-in-out",
          isOpen && "opacity-0 scale-x-0"
        )}
      />
      {/* Bottom Bar */}
      <span
        className={cn(
          "w-5 h-0.5 bg-current rounded-full transition-all duration-300 ease-in-out origin-center",
          isOpen && "-translate-y-2 -rotate-45"
        )}
      />
    </button>
  );
}
