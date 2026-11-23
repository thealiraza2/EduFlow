import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Dashboard kit — one visual language for every portal (admin, teacher, parent,
 * student, platform). Server-safe (no hooks). Fully responsive:
 *   - PageHeader stacks on phones, actions wrap.
 *   - StatGrid: 2 columns on phones, 4 on desktop.
 *   - Panel paddings shrink on phones; content never forces page overflow (min-w-0).
 */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">{eyebrow}</p>
        )}
        <h1 className="mt-1 font-serif text-[32px] leading-[1.08] tracking-[-0.01em] text-ink sm:text-[38px]">{title}</h1>
        {description && <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

type Tone = "plum" | "success" | "warning" | "danger" | "info" | "neutral";

const toneChip: Record<Tone, string> = {
  plum: "bg-primary-tint text-primary",
  success: "bg-status-success-bg text-status-success",
  warning: "bg-status-warning-bg text-status-warning",
  danger: "bg-status-danger-bg text-status-danger",
  info: "bg-status-info-bg text-status-info",
  neutral: "bg-surface-sunken text-ink-2",
};

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4 [&>*]:min-w-0", className)}>{children}</div>;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  tone = "plum",
  href,
  footer,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  icon?: LucideIcon;
  tone?: Tone;
  href?: string;
  footer?: React.ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[13px] font-medium leading-snug text-ink-2">{label}</p>
        {Icon && (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9", toneChip[tone])}>
            <Icon className="h-4 w-4" strokeWidth={1.9} />
          </span>
        )}
      </div>
      <p className="mt-2 truncate text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-ink sm:mt-3 sm:text-[30px]">
        {value}
      </p>
      {sub && <p className="mt-2 line-clamp-2 text-[12.5px] leading-snug text-ink-3 sm:text-[13px]">{sub}</p>}
      {footer && <div className="mt-3 border-t border-line pt-3">{footer}</div>}
    </>
  );
  const cls =
    "group relative block rounded-2xl border border-line bg-surface p-4 shadow-1 sm:p-5";
  return href ? (
    <Link href={href} className={cn(cls, "transition-[box-shadow,border-color] hover:border-line-strong hover:shadow-2 focus-visible:outline-none focus-visible:shadow-focus")}>
      {body}
      <ArrowUpRight className="absolute bottom-4 right-4 h-4 w-4 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush = false,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Remove body padding (tables that run edge to edge) */
  flush?: boolean;
}) {
  return (
    <section className={cn("min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-1", className)}>
      {(title || action) && (
        <div className="flex flex-col gap-2 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-[16px] font-bold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-[13px] text-ink-3">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={cn(flush ? "" : "p-4 sm:p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  body?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center px-4 py-10 text-center", className)}>
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-sunken text-ink-3">
          <Icon className="h-5 w-5" strokeWidth={1.6} />
        </span>
      )}
      <p className="mt-3 text-[15px] font-semibold text-ink">{title}</p>
      {body && <p className="mt-1 max-w-[380px] text-[14px] text-ink-2">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function StatusPill({ tone = "neutral", children }: { tone?: Tone; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-semibold", toneChip[tone])}>
      {children}
    </span>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  icon: Icon,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "press inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[14px] font-semibold focus-visible:outline-none focus-visible:shadow-focus",
        variant === "primary"
          ? "bg-primary text-white hover:bg-primary-hover"
          : "border border-line-strong bg-surface text-ink hover:bg-surface-sunken"
      )}
    >
      {Icon && <Icon className="h-4 w-4" strokeWidth={1.9} />}
      {children}
    </Link>
  );
}

/** Small "label → value" list used in side panels. */
export function KeyValueList({ items }: { items: { label: React.ReactNode; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-line">
      {items.map((it, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2.5 text-[14px]">
          <dt className="min-w-0 truncate text-ink-2">{it.label}</dt>
          <dd className="shrink-0 font-semibold tabular-nums text-ink">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}
