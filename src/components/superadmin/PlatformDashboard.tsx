"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Clock,
  GraduationCap,
  Inbox,
  Loader2,
  LogIn,
  Megaphone,
  Plus,
  Power,
  Search,
  Settings2,
  Users,
  Wallet,
} from "@/components/icons";
import { formatPKR } from "@/lib/money";
import { openAcademyAsAdminAction, toggleAcademyStatusAction } from "@/lib/actions/superadmin";
import { ButtonLink, EmptyState, HeroFigure, HeroPanel, PageHeader, Panel, RadialStat, StatusPill } from "@/components/dashboard/kit";
import { NumberTicker } from "@/components/magicui";
import { cn } from "@/lib/utils";

export interface DashboardAcademy {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "GROWTH" | "PRO";
  status: "ACTIVE" | "SUSPENDED";
  onTrial: boolean;
  trialDaysLeft: number | null;
  students: number;
  teachers: number;
  adminName: string | null;
  adminEmail: string | null;
  createdAt: string;
  monthlyFeeMinor: number;
}

interface Props {
  ownerName: string;
  today: string;
  kpis: {
    mrrMinor: number;
    paying: number;
    academies: number;
    active: number;
    newThisMonth: number;
    trials: number;
    trialsEndingSoon: number;
    students: number;
    teachers: number;
  };
  signups: { key: string; label: string; count: number }[];
  planMix: { key: string; label: string; count: number }[];
  attention: { id: string; name: string; kind: "trial" | "suspended" | "setup"; detail: string }[];
  inbox: { total: number; latest: { id: string; name: string; message: string; createdAt: string }[] };
  academies: DashboardAcademy[];
}

// Plan tiers are ordered: amber trial, neutral free, then a light→dark royal-ink ramp for paid tiers.
const PLAN_COLORS: Record<string, string> = {
  trial: "#E3A93B",
  free: "#CDD2E0",
  starter: "#AAB6FA",
  growth: "#4A62E8",
  pro: "#182A90",
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
}

function ago(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

/* ───────────── Charts ───────────── */

function SignupsChart({ data }: { data: Props["signups"] }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div>
      <p className="text-[13px] text-ink-3">
        <span className="text-[22px] font-bold tabular-nums text-ink">{total}</span> new academies in 6 months
      </p>
      <div className="relative mt-5 flex h-[170px] items-end gap-2 border-b border-line sm:gap-4" role="img" aria-label={`New academies per month: ${data.map((d) => `${d.label} ${d.count}`).join(", ")}`}>
        {[0.5, 1].map((f) => (
          <div key={f} aria-hidden className="pointer-events-none absolute inset-x-0 border-t border-dashed border-line" style={{ bottom: `${f * 100}%` }} />
        ))}
        {data.map((d, i) => (
          <div
            key={d.key}
            className="relative flex h-full flex-1 flex-col items-center justify-end"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            {(hover === i || d.count === max) && d.count > 0 && (
              <span className="mb-1 rounded-md bg-ink px-1.5 py-0.5 text-[11.5px] font-semibold tabular-nums text-white">{d.count}</span>
            )}
            <div
              className={cn("w-full max-w-[44px] rounded-t-[4px] transition-colors", hover === i ? "bg-primary-hover" : "bg-primary")}
              style={{ height: `${d.count === 0 ? 0 : Math.max(4, (d.count / max) * 82)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-2 sm:gap-4">
        {data.map((d) => (
          <span key={d.key} className="flex-1 text-center text-[12px] text-ink-3">
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function PlanMix({ data, total }: { data: Props["planMix"]; total: number }) {
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-surface-sunken" role="img" aria-label={data.map((d) => `${d.label} ${d.count}`).join(", ")}>
        {data
          .filter((d) => d.count > 0)
          .map((d) => (
            <div
              key={d.key}
              title={`${d.label}: ${d.count}`}
              className="h-full border-r-2 border-surface last:border-r-0"
              style={{ width: `${(d.count / Math.max(1, total)) * 100}%`, background: PLAN_COLORS[d.key] }}
            />
          ))}
      </div>
      <ul className="mt-5 space-y-2.5">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-3 text-[14px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: PLAN_COLORS[d.key] }} />
            <span className="flex-1 text-ink-2">{d.label}</span>
            <span className="font-semibold tabular-nums text-ink">{d.count}</span>
            <span className="w-11 text-right text-[12.5px] tabular-nums text-ink-3">
              {total ? Math.round((d.count / total) * 100) : 0}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ───────────── Academies table ───────────── */

type Tab = "all" | "active" | "trial" | "suspended";

function PlanBadge({ a }: { a: DashboardAcademy }) {
  if (a.onTrial)
    return (
      <StatusPill tone="warning">
        Trial · {a.trialDaysLeft}d
      </StatusPill>
    );
  return <StatusPill tone="plum">{a.plan.charAt(0) + a.plan.slice(1).toLowerCase()}</StatusPill>;
}

function StatusBadge({ s }: { s: DashboardAcademy["status"] }) {
  return s === "ACTIVE" ? <StatusPill tone="success">● Active</StatusPill> : <StatusPill tone="danger">● Suspended</StatusPill>;
}

function AcademiesSection({ academies }: { academies: DashboardAcademy[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"newest" | "students" | "revenue" | "name">("newest");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const counts = {
    all: academies.length,
    active: academies.filter((a) => a.status === "ACTIVE").length,
    trial: academies.filter((a) => a.onTrial).length,
    suspended: academies.filter((a) => a.status === "SUSPENDED").length,
  };

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = academies.filter((a) =>
      tab === "all" ? true : tab === "trial" ? a.onTrial : tab === "active" ? a.status === "ACTIVE" : a.status === "SUSPENDED"
    );
    if (s) list = list.filter((a) => `${a.name} ${a.slug} ${a.adminEmail ?? ""} ${a.adminName ?? ""}`.toLowerCase().includes(s));
    const sorted = [...list];
    if (sort === "students") sorted.sort((a, b) => b.students - a.students);
    else if (sort === "revenue") sorted.sort((a, b) => b.monthlyFeeMinor - a.monthlyFeeMinor);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [academies, tab, q, sort]);

  const toggle = (a: DashboardAcademy) => {
    setBusy(`status-${a.id}`);
    start(async () => {
      await toggleAcademyStatusAction(a.id, a.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE");
      setBusy(null);
      router.refresh();
    });
  };
  const open = (a: DashboardAcademy) => {
    setBusy(`open-${a.id}`);
    start(() => openAcademyAsAdminAction(a.id));
  };

  const Actions = ({ a, compact = false }: { a: DashboardAcademy; compact?: boolean }) => (
    <div className={cn("flex items-center gap-1.5", compact ? "flex-wrap" : "justify-end")}>
      <button
        type="button"
        onClick={() => open(a)}
        disabled={pending}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3 text-[12.5px] font-semibold text-white hover:bg-primary-hover disabled:opacity-60"
        title="Work inside this academy as admin"
      >
        {pending && busy === `open-${a.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
        Open
      </button>
      <Link
        href={`/superadmin/academies/${a.id}`}
        className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 text-[12.5px] font-semibold text-ink hover:bg-surface-sunken"
      >
        <Settings2 className="h-3.5 w-3.5" />
        Manage
      </Link>
      <button
        type="button"
        title={a.status === "ACTIVE" ? "Suspend academy" : "Activate academy"}
        onClick={() => toggle(a)}
        disabled={pending}
        className={cn(
          compact ? "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-semibold disabled:opacity-60" : "inline-flex h-8 w-8 items-center justify-center rounded-full disabled:opacity-60",
          a.status === "ACTIVE" ? "text-status-danger hover:bg-status-danger-bg" : "text-status-success hover:bg-status-success-bg"
        )}
      >
        {pending && busy === `status-${a.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Power className="h-3.5 w-3.5" />}
        <span className={compact ? "" : "sr-only"}>{a.status === "ACTIVE" ? "Suspend" : "Activate"}</span>
      </button>
    </div>
  );

  const tabs: { key: Tab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "trial", label: "On trial" },
    { key: "suspended", label: "Suspended" },
  ];

  return (
    <Panel
      title="Academies"
      description="Every school on EduFlow. Open one to work inside it, or manage its plan, trial and users."
      action={<ButtonLink href="/superadmin/academies/new" icon={Plus}>New academy</ButtonLink>}
      flush
    >
      <div className="flex flex-col gap-3 border-b border-line px-4 py-3 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-semibold transition-colors",
                tab === t.key ? "bg-ink text-white" : "text-ink-2 hover:bg-surface-sunken"
              )}
            >
              {t.label}
              <span className={cn("tabular-nums", tab === t.key ? "text-white/70" : "text-ink-3")}>{counts[t.key]}</span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative block sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search school, slug or admin"
              className="h-9 w-full rounded-full border border-line-strong bg-surface pl-9 pr-3 text-[14px] text-ink placeholder:text-ink-3 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            />
          </label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-9 rounded-full border border-line-strong bg-surface px-3 text-[14px] text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-label="Sort academies"
          >
            <option value="newest">Newest first</option>
            <option value="students">Most students</option>
            <option value="revenue">Highest revenue</option>
            <option value="name">Name A–Z</option>
          </select>
        </div>
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={Building2} title={q ? `No academy matches “${q}”` : "No academies here yet"} body="Try another filter, or create an academy yourself." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full text-left text-[14px]">
              <thead>
                <tr className="border-b border-line bg-surface-sunken/60 text-[12px] font-semibold uppercase tracking-[0.06em] text-ink-3">
                  <th className="px-5 py-3">Academy</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Students</th>
                  <th className="hidden px-3 py-3 2xl:table-cell">Admin</th>
                  <th className="px-3 py-3 text-right">Monthly</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {shown.map((a) => (
                  <tr key={a.id} className="transition-colors hover:bg-canvas">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[13px] font-bold text-primary">
                          {initials(a.name)}
                        </span>
                        <div className="min-w-0">
                          <Link href={`/superadmin/academies/${a.id}`} className="block truncate font-semibold text-ink hover:text-primary">
                            {a.name}
                          </Link>
                          <p className="truncate font-mono text-[12px] text-ink-3">
                            {a.slug}.eduflow.app · {ago(a.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3.5"><PlanBadge a={a} /></td>
                    <td className="px-3 py-3.5"><StatusBadge s={a.status} /></td>
                    <td className="px-3 py-3.5 text-right tabular-nums">
                      <span className="font-semibold text-ink">{a.students}</span>
                      <span className="block text-[12px] text-ink-3">{a.teachers} teachers</span>
                    </td>
                    <td className="hidden max-w-[220px] px-3 py-3.5 2xl:table-cell">
                      <p className="truncate text-ink">{a.adminName ?? "—"}</p>
                      <p className="truncate text-[12px] text-ink-3">{a.adminEmail ?? ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3.5 text-right font-semibold tabular-nums text-ink">
                      {a.monthlyFeeMinor ? formatPKR(a.monthlyFeeMinor) : <span className="font-normal text-ink-3">—</span>}
                    </td>
                    <td className="px-5 py-3.5"><Actions a={a} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Phone & tablet cards */}
          <ul className="divide-y divide-line lg:hidden">
            {shown.map((a) => (
              <li key={a.id} className="p-4 sm:px-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-tint text-[13px] font-bold text-primary">
                    {initials(a.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/superadmin/academies/${a.id}`} className="block truncate text-[15px] font-semibold text-ink">
                      {a.name}
                    </Link>
                    <p className="truncate font-mono text-[12px] text-ink-3">{a.slug}.eduflow.app</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <PlanBadge a={a} />
                      <StatusBadge s={a.status} />
                    </div>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-surface-sunken/70 p-3 text-center">
                  <div>
                    <dt className="text-[11.5px] text-ink-3">Students</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-ink">{a.students}</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-ink-3">Teachers</dt>
                    <dd className="text-[15px] font-bold tabular-nums text-ink">{a.teachers}</dd>
                  </div>
                  <div>
                    <dt className="text-[11.5px] text-ink-3">Monthly</dt>
                    <dd className="truncate text-[15px] font-bold tabular-nums text-ink">
                      {a.monthlyFeeMinor ? formatPKR(a.monthlyFeeMinor).replace("PKR ", "") : "—"}
                    </dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <Actions a={a} compact />
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

/* ───────────── Page ───────────── */

export function PlatformDashboard(props: Props) {
  const { kpis, signups, planMix, attention, inbox, academies, ownerName, today } = props;
  const dateLabel = new Date(today).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const attentionIcon = { trial: Clock, suspended: Power, setup: AlertTriangle } as const;
  const attentionTone = {
    trial: "bg-status-warning-bg text-status-warning",
    suspended: "bg-status-danger-bg text-status-danger",
    setup: "bg-status-info-bg text-status-info",
  } as const;

  return (
    <div className="mx-auto w-full max-w-[1320px] space-y-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <PageHeader
        eyebrow={dateLabel}
        title={<>Welcome back, {ownerName}</>}
        description="Here's how EduFlow is doing across every academy today."
        actions={
          <>
            <ButtonLink href="/superadmin/announcements" variant="secondary" icon={Megaphone}>
              Announcement
            </ButtonLink>
            <ButtonLink href="/superadmin/academies/new" icon={Plus}>
              New academy
            </ButtonLink>
          </>
        }
      />

      <HeroPanel
        title="Platform today"
        subtitle={`${kpis.active} active academies, ${kpis.newThisMonth} joined this month`}
        aside={<RadialStat value={kpis.academies ? (kpis.paying / kpis.academies) * 100 : 0} label="Academies paying" />}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-[1.7fr_1fr_1fr_1fr] [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1">
          <HeroFigure
            label="Monthly revenue"
            value={<NumberTicker value={kpis.mrrMinor / 100} prefix="PKR " />}
            hint="Estimated from active plans"
          />
          <HeroFigure label="Academies" value={<NumberTicker value={kpis.academies} />} hint={`${kpis.paying} paying`} />
          <HeroFigure
            label="On free trial"
            value={<NumberTicker value={kpis.trials} />}
            hint={kpis.trialsEndingSoon ? `${kpis.trialsEndingSoon} ending within 3 days` : "None ending this week"}
          />
          <HeroFigure
            label="Students"
            value={<NumberTicker value={kpis.students} />}
            hint={`${kpis.teachers.toLocaleString()} teachers`}
          />
        </div>
      </HeroPanel>
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Panel title="Growth" description="New academies per month" className="lg:col-span-2">
          <SignupsChart data={signups} />
        </Panel>
        <Panel title="Plan mix" description={`${kpis.academies} academies`}>
          <PlanMix data={planMix} total={kpis.academies} />
        </Panel>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Panel
          title="Needs attention"
          description="Academies where a nudge from you helps"
          className="lg:col-span-2"
          flush
        >
          {attention.length === 0 ? (
            <EmptyState icon={Users} title="All clear" body="No trials ending, no suspended academies and everyone has started adding students." />
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((a) => {
                const Icon = attentionIcon[a.kind];
                return (
                  <li key={`${a.kind}-${a.id}`}>
                    <Link
                      href={`/superadmin/academies/${a.id}`}
                      className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5"
                    >
                      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-full", attentionTone[a.kind])}>
                        <Icon className="h-4 w-4" strokeWidth={1.9} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14.5px] font-semibold text-ink">{a.name}</span>
                        <span className="block truncate text-[13px] text-ink-3">{a.detail}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-ink-3 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel
          title="Inbox"
          description={`${inbox.total} message${inbox.total === 1 ? "" : "s"} from the website`}
          action={
            <Link href="/superadmin/inbox" className="text-[13px] font-semibold text-primary hover:underline">
              Open inbox
            </Link>
          }
          flush
        >
          {inbox.latest.length === 0 ? (
            <EmptyState icon={Inbox} title="No messages yet" body="Contact-form messages will land here." />
          ) : (
            <ul className="divide-y divide-line">
              {inbox.latest.map((m) => (
                <li key={m.id} className="px-4 py-3.5 sm:px-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-[14.5px] font-semibold text-ink">{m.name}</p>
                    <span className="shrink-0 text-[12px] text-ink-3">{ago(m.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13.5px] text-ink-2">{m.message}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <AcademiesSection academies={academies} />
    </div>
  );
}
