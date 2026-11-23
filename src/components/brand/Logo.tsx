import { cn } from "@/lib/utils";

/**
 * EduFlow mark: a greenboard tile with three chalk register lines and a tick.
 * DESIGN.md — the "well-kept school register".
 */
export function LogoMark({ className, title = "EduFlow" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8 shrink-0", className)} role="img" aria-label={title}>
      <rect width="32" height="32" rx="8" fill="#0F4F45" />
      <path d="M8 10.5h10M8 16h6.5M8 21.5h8" stroke="#E8EFEC" strokeOpacity=".6" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M17.5 17.5l3 3 5.5-7.5"
        stroke="#FFFFFF"
        strokeWidth="2.4"
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
  /** dark = ink text for light backgrounds; light = chalk text for the greenboard sidebar */
  tone?: "dark" | "light";
  showTagline?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif text-[21px] font-semibold tracking-[-0.01em]",
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
