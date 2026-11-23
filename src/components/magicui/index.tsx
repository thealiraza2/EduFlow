"use client";

/**
 * Magic UI components (https://magicui.design, MIT) adapted to this project's
 * Tailwind 3 setup and design tokens. Used sparingly: motion is reserved for one
 * orchestrated moment per screen. All respect prefers-reduced-motion.
 */

import { useEffect, useId, useRef, type ComponentPropsWithoutRef, type CSSProperties } from "react";
import { motion, useInView, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { cn } from "@/lib/utils";

/* ───────────── NumberTicker ───────────── */

export function NumberTicker({
  value,
  startValue = 0,
  delay = 0,
  decimalPlaces = 0,
  prefix = "",
  suffix = "",
  className,
  ...props
}: ComponentPropsWithoutRef<"span"> & {
  value: number;
  startValue?: number;
  delay?: number;
  decimalPlaces?: number;
  prefix?: string;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduce = useReducedMotion();
  const motionValue = useMotionValue(reduce ? value : startValue);
  const spring = useSpring(motionValue, { damping: 60, stiffness: 100 });
  const inView = useInView(ref, { once: true, margin: "0px" });
  const fmt = (n: number) =>
    prefix +
    Intl.NumberFormat("en-US", { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces }).format(
      Number(n.toFixed(decimalPlaces))
    ) +
    suffix;

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionValue.set(value), delay * 1000);
    return () => clearTimeout(t);
  }, [inView, value, delay, motionValue]);

  useEffect(
    () =>
      spring.on("change", (latest) => {
        if (ref.current) ref.current.textContent = fmt(latest);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [spring, decimalPlaces, prefix, suffix]
  );

  return (
    <span ref={ref} className={cn("inline-block tabular-nums", className)} {...props}>
      {fmt(reduce ? value : startValue)}
    </span>
  );
}

/* ───────────── BorderBeam ───────────── */

export function BorderBeam({
  size = 120,
  duration = 8,
  delay = 0,
  colorFrom = "#7387F2",
  colorTo = "#2743D6",
  borderWidth = 1.5,
  className,
}: {
  size?: number;
  duration?: number;
  delay?: number;
  colorFrom?: string;
  colorTo?: string;
  borderWidth?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  // A conic light rotating behind a border-only mask: works in every modern browser.
  const arc = Math.max(8, Math.min(40, size / 6));
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]", className)}
      style={
        {
          padding: borderWidth,
          WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box exclude, linear-gradient(#000 0 0)",
        } as CSSProperties
      }
    >
      <motion.div
        className="absolute left-1/2 top-1/2 aspect-square w-[200%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background: `conic-gradient(from 0deg, transparent 0deg, transparent ${360 - arc * 2}deg, ${colorTo} ${360 - arc}deg, ${colorFrom} 360deg)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, ease: "linear", duration, delay: -delay }}
      />
    </div>
  );
}

/* ───────────── DotPattern ───────────── */

export function DotPattern({
  width = 18,
  height = 18,
  cr = 1,
  className,
}: {
  width?: number;
  height?: number;
  cr?: number;
  className?: string;
}) {
  const id = useId();
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full fill-ink/[0.09]", className)}>
      <defs>
        <pattern id={id} width={width} height={height} patternUnits="userSpaceOnUse">
          <circle cx={width / 2} cy={height / 2} r={cr} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

/* ───────────── Marquee ───────────── */

export function Marquee({
  children,
  reverse = false,
  pauseOnHover = true,
  repeat = 3,
  duration = 40,
  className,
}: {
  children: React.ReactNode;
  reverse?: boolean;
  pauseOnHover?: boolean;
  repeat?: number;
  duration?: number;
  className?: string;
}) {
  return (
    <div
      className={cn("group flex overflow-hidden [--gap:2.5rem] [gap:var(--gap)]", className)}
      style={{ ["--duration" as string]: `${duration}s` }}
    >
      {Array.from({ length: repeat }).map((_, i) => (
        <div
          key={i}
          aria-hidden={i > 0}
          className={cn(
            "flex shrink-0 justify-around [gap:var(--gap)] motion-safe:animate-marquee",
            reverse && "[animation-direction:reverse]",
            pauseOnHover && "group-hover:[animation-play-state:paused]"
          )}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* ───────────── ShimmerButton (as a styling wrapper for links/buttons) ───────────── */

export const shimmerClass =
  "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden whitespace-nowrap rounded-full bg-primary px-6 font-semibold text-white shadow-[0_8px_24px_-8px_rgba(39,67,214,.7),inset_0_1px_0_rgba(255,255,255,.25)] transition-[transform,background-color] hover:bg-primary-hover active:scale-[0.98] focus-visible:outline-none focus-visible:shadow-focus before:absolute before:inset-0 before:-z-10 before:translate-x-[-100%] before:bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,.35)_50%,transparent_75%)] motion-safe:before:animate-shimmer";

/* ───────────── BlurFade (single reveal) ───────────── */

export function BlurFade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.5, delay, ease: [0.2, 0.8, 0.2, 1] }}
    >
      {children}
    </motion.div>
  );
}
