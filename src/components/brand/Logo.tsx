"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

/**
 * EduFlow mark: an ink-blue tile with three ruled register lines that read as
 * an "E", and a red-pen dot where the shorter middle line ends — "marked".
 * Each instance gets its own gradient ids so it renders even when another
 * copy of the mark on the page is hidden.
 */
export function LogoMark({ className, title = "EduFlow" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const fill = `ef-fill-${id}`;
  const gloss = `ef-gloss-${id}`;
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} role="img" aria-label={title}>
      <defs>
        <linearGradient id={fill} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4562FF" />
          <stop offset="1" stopColor="#1A2AA6" />
        </linearGradient>
        <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.26" />
          <stop offset="0.55" stopColor="#FFFFFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${fill})`} />
      <rect width="32" height="32" rx="9" fill={`url(#${gloss})`} />
      <rect x="0.5" y="0.5" width="31" height="31" rx="8.5" fill="none" stroke="#FFFFFF" strokeOpacity="0.16" />
      <rect x="9.5" y="8.5" width="12.5" height="3.2" rx="1.6" fill="#FFFFFF" />
      <rect x="9.5" y="14.4" width="8.5" height="3.2" rx="1.6" fill="#FFFFFF" fillOpacity="0.72" />
      <rect x="9.5" y="20.3" width="12.5" height="3.2" rx="1.6" fill="#FFFFFF" />
      <circle cx="22.2" cy="16" r="2.1" fill="#FF6B76" />
    </svg>
  );
}

/** The name, set in the display face. */
export function Wordmark({
  className,
  tone = "dark",
}: {
  className?: string;
  tone?: "dark" | "light";
}) {
  return (
    <span
      className={cn(
        "font-serif text-[21px] font-extrabold leading-none tracking-[-0.035em]",
        tone === "dark" ? "text-ink" : "text-white",
        className
      )}
    >
      EduFlow
    </span>
  );
}

export function Logo({
  className,
  tone = "dark",
  size = "md",
  showTagline = false,
}: {
  className?: string;
  /** dark = ink text for light backgrounds; light = white text for dark backgrounds */
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
}) {
  const mark = { sm: "h-7 w-7", md: "h-8 w-8", lg: "h-10 w-10" }[size];
  const word = { sm: "text-[18px]", md: "text-[21px]", lg: "text-[26px]" }[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className={mark} />
      <span className="flex flex-col">
        <Wordmark tone={tone} className={word} />
        {showTagline && (
          <span className={cn("mt-1 text-[12px] font-medium", tone === "dark" ? "text-ink-3" : "text-sidebar-ink-2")}>
            School management
          </span>
        )}
      </span>
    </span>
  );
}
