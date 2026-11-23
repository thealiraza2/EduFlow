import { cn } from "@/lib/utils";

/** EduFlow mark: a plum seal with a single tick — "marked present". */
export function LogoMark({ className, title = "EduFlow" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} role="img" aria-label={title}>
      <circle cx="16" cy="16" r="16" fill="#6D1F3A" />
      <path
        d="M9.5 16.5l4.2 4.2 8.8-9.4"
        stroke="#FFFFFF"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "dark",
  showTagline = false,
}: {
  className?: string;
  /** dark = ink text for light backgrounds; light = pale text for dark backgrounds */
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "text-[20px] font-bold tracking-[-0.02em]",
            tone === "dark" ? "text-ink" : "text-sidebar-ink"
          )}
        >
          EduFlow
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-xs font-medium uppercase tracking-[0.12em]",
              tone === "dark" ? "text-ink-3" : "text-sidebar-ink-2"
            )}
          >
            School management
          </span>
        )}
      </span>
    </span>
  );
}
