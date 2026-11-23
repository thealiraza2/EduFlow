import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

// DESIGN.md §5 — 40px, 8px radius, 1px line-strong, focus ring in greenboard.
const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-line-strong bg-surface px-3 text-[15px] text-ink shadow-1 transition-colors placeholder:text-ink-3 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:bg-[rgb(var(--disabled-bg))] disabled:text-[rgb(var(--disabled-ink))] aria-[invalid=true]:border-status-danger",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
