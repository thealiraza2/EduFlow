import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// DESIGN.md §5 — 8px corners, 1px hairline borders, greenboard fill for the
// single primary action, press sinks to 98%.
const buttonVariants = cva(
  "press inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-[14.5px] font-semibold transition-colors focus-visible:outline-none focus-visible:shadow-focus disabled:pointer-events-none disabled:bg-[rgb(var(--disabled-bg))] disabled:text-[rgb(var(--disabled-ink))] disabled:border-transparent [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_-10px_rgb(var(--primary)/0.7)] hover:bg-primary-hover active:bg-primary-pressed",
        destructive:
          "border border-status-danger/40 bg-surface text-status-danger hover:bg-status-danger-bg",
        "destructive-solid": "bg-status-danger text-white hover:bg-red-700",
        outline: "border border-line-strong bg-surface text-ink hover:bg-surface-sunken",
        secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-sunken",
        ghost: "text-ink-2 hover:bg-surface-sunken hover:text-ink",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3 text-sm",
        lg: "h-11 px-5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
