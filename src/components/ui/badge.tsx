import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// DESIGN.md §5 — 6px radius, status bg + status text, 12px/600, always a word.
const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold leading-5",
  {
    variants: {
      variant: {
        default: "bg-primary-tint text-primary",
        secondary: "bg-surface-sunken text-ink-2",
        destructive: "bg-status-danger-bg text-status-danger",
        outline: "border-line-strong bg-surface text-ink-2",
        success: "bg-status-success-bg text-status-success",
        warning: "bg-status-warning-bg text-status-warning",
        danger: "bg-status-danger-bg text-status-danger",
        info: "bg-status-info-bg text-status-info",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
