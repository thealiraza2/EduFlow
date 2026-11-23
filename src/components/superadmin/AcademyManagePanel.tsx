"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleAlert, CircleCheck, KeyRound, Loader2, LogIn, Trash2, UserPlus } from "@/components/icons";
import {
  addAcademyAdminAction,
  deleteAcademyAction,
  openAcademyAsAdminAction,
  resetUserPasswordAction,
  setAcademyTrialAction,
  toggleAcademyStatusAction,
  updateAcademyPlanAction,
} from "@/lib/actions/superadmin";
import { ConsoleSection, TempPasswordNotice, fieldClass, primaryBtn, secondaryBtn } from "./ConsoleUI";

type Plan = "FREE" | "STARTER" | "GROWTH" | "PRO";
type Status = "ACTIVE" | "SUSPENDED";

interface Props {
  academy: {
    id: string;
    name: string;
    slug: string;
    plan: Plan;
    status: Status;
    trialEndsAt: string | null;
    counts: { students: number; teachers: number; classes: number; feeInvoices: number };
  };
  users: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: string;
    mustChangePassword: boolean;
    createdAt: string;
  }[];
}

const roleLabel: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Teacher",
  PARENT: "Parent",
  STUDENT: "Student",
  SUPER_ADMIN: "Super admin",
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function AcademyManagePanel({ academy, users }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [secret, setSecret] = useState<{ email: string; password: string } | null>(null);
  const [extendDays, setExtendDays] = useState("14");
  const [trialDate, setTrialDate] = useState("");
  const [plan, setPlan] = useState<Plan>(academy.plan);
  const [newAdmin, setNewAdmin] = useState({ name: "", email: "", phone: "" });
  const [confirmSlug, setConfirmSlug] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const now = Date.now();
  const onTrial = academy.trialEndsAt ? new Date(academy.trialEndsAt).getTime() > now : false;
  const daysLeft = onTrial ? Math.ceil((new Date(academy.trialEndsAt!).getTime() - now) / 86400000) : 0;

  const run = (key: string, fn: () => Promise<{ success: boolean; error?: string } & Record<string, unknown>>, ok?: string) => {
    setMsg(null);
    setBusy(key);
    start(async () => {
      try {
        const res = await fn();
        if (res.success) {
          if (ok) setMsg({ tone: "ok", text: ok });
          router.refresh();
        } else setMsg({ tone: "err", text: res.error || "Something went wrong." });
      } catch (e) {
        setMsg({ tone: "err", text: e instanceof Error ? e.message : "Something went wrong." });
      } finally {
        setBusy(null);
      }
    });
  };

  const spin = (key: string) => pending && busy === key;
  const shownUsers = roleFilter === "ALL" ? users : users.filter((u) => u.role === roleFilter);

  return (
    <div className="space-y-5">
      {msg && (
        <p
          role={msg.tone === "err" ? "alert" : "status"}
          className={
            "flex items-start gap-2 rounded-xl p-3.5 text-[14px] " +
            (msg.tone === "ok" ? "bg-status-success-bg text-status-success" : "bg-status-danger-bg text-status-danger")
          }
        >
          {msg.tone === "ok" ? <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
          {msg.text}
        </p>
      )}
      {secret && <TempPasswordNotice email={secret.email} password={secret.password} onDone={() => setSecret(null)} />}

      {/* Overview */}
      <ConsoleSection title="Overview">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            ["Students", academy.counts.students],
            ["Teachers", academy.counts.teachers],
            ["Classes", academy.counts.classes],
            ["Invoices", academy.counts.feeInvoices],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl bg-surface-sunken p-3">
              <dt className="text-[13px] text-ink-3">{k}</dt>
              <dd className="mt-1 text-[24px] font-bold tabular-nums text-ink">{v as number}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span
            className={
              "rounded-full px-3 py-1 text-[12.5px] font-semibold " +
              (academy.status === "ACTIVE" ? "bg-status-success-bg text-status-success" : "bg-status-danger-bg text-status-danger")
            }
          >
            {academy.status === "ACTIVE" ? "Active" : "Suspended"}
          </span>
          <span className="rounded-full bg-primary-tint px-3 py-1 text-[12.5px] font-semibold text-primary">{academy.plan} plan</span>
          <span className="rounded-full bg-surface-sunken px-3 py-1 text-[12.5px] font-semibold text-ink-2">
            {onTrial ? `Trial · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left` : "Not on trial"}
          </span>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              setBusy("open");
              start(() => openAcademyAsAdminAction(academy.id));
            }}
            className={primaryBtn}
          >
            {spin("open") ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Open as admin
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              run(
                "status",
                () => toggleAcademyStatusAction(academy.id, academy.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"),
                academy.status === "ACTIVE" ? "Academy suspended — its users can no longer sign in." : "Academy activated."
              )
            }
            className={secondaryBtn}
          >
            {spin("status") && <Loader2 className="h-4 w-4 animate-spin" />}
            {academy.status === "ACTIVE" ? "Suspend academy" : "Activate academy"}
          </button>
        </div>
      </ConsoleSection>

      <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        {/* Plan */}
        <ConsoleSection title="Plan" description="Changes the plan immediately. Billing records are managed outside EduFlow for now.">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select className={fieldClass} value={plan} onChange={(e) => setPlan(e.target.value as Plan)}>
              <option value="STARTER">Starter — PKR 2,500 / month</option>
              <option value="GROWTH">Growth — PKR 5,000 / month</option>
              <option value="PRO">Pro — PKR 9,000 / month</option>
              <option value="FREE">Free</option>
            </select>
            <button
              type="button"
              disabled={pending || plan === academy.plan}
              onClick={() => run("plan", () => updateAcademyPlanAction(academy.id, plan), `Plan changed to ${plan}.`)}
              className={primaryBtn + " shrink-0"}
            >
              {spin("plan") && <Loader2 className="h-4 w-4 animate-spin" />}
              Save plan
            </button>
          </div>
        </ConsoleSection>

        {/* Trial */}
        <ConsoleSection
          title="Free trial"
          description={
            onTrial
              ? `Ends ${fmtDate(academy.trialEndsAt!)} (${daysLeft} day${daysLeft === 1 ? "" : "s"} left).`
              : "This academy is not on a trial."
          }
        >
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <select className={fieldClass} value={extendDays} onChange={(e) => setExtendDays(e.target.value)}>
                {[7, 14, 30, 60].map((d) => (
                  <option key={d} value={d}>
                    {onTrial ? `Extend by ${d} days` : `Start a ${d}-day trial`}
                  </option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() =>
                  run("extend", () => setAcademyTrialAction(academy.id, "extend", Number(extendDays)), "Trial updated.")
                }
                className={primaryBtn + " shrink-0"}
              >
                {spin("extend") && <Loader2 className="h-4 w-4 animate-spin" />}
                {onTrial ? "Extend" : "Start"}
              </button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="date"
                className={fieldClass}
                value={trialDate}
                min={new Date(now + 86400000).toISOString().slice(0, 10)}
                onChange={(e) => setTrialDate(e.target.value)}
                aria-label="Trial end date"
              />
              <button
                type="button"
                disabled={pending || !trialDate}
                onClick={() =>
                  run("set", () => setAcademyTrialAction(academy.id, "set", `${trialDate}T23:59:59`), "Trial end date set.")
                }
                className={secondaryBtn + " shrink-0"}
              >
                Set end date
              </button>
            </div>
            {onTrial && (
              <button
                type="button"
                disabled={pending}
                onClick={() => run("end", () => setAcademyTrialAction(academy.id, "end"), "Trial ended — the academy is now on its paid plan.")}
                className="text-[14px] font-semibold text-status-danger hover:underline"
              >
                End trial now
              </button>
            )}
          </div>
        </ConsoleSection>
      </div>

      {/* Users */}
      <ConsoleSection
        title={`Users (${users.length})`}
        description="Reset a password to issue a new temporary one. The user must change it on next login."
      >
        <div className="mb-3 flex flex-wrap gap-1.5">
          {["ALL", "ADMIN", "TEACHER", "PARENT", "STUDENT"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRoleFilter(r)}
              className={
                "rounded-full px-3 py-1 text-[13px] font-semibold " +
                (roleFilter === r ? "bg-primary text-white" : "bg-surface-sunken text-ink-2 hover:text-ink")
              }
            >
              {r === "ALL" ? "All" : roleLabel[r]}
              {" · "}
              {r === "ALL" ? users.length : users.filter((u) => u.role === r).length}
            </button>
          ))}
        </div>
        {shownUsers.length === 0 ? (
          <p className="rounded-xl bg-surface-sunken p-4 text-[14px] text-ink-2">No users in this group yet.</p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line">
            {shownUsers.map((u) => (
              <li key={u.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">
                    {u.name}{" "}
                    <span className="ml-1 rounded-full bg-surface-sunken px-2 py-0.5 text-[11.5px] font-semibold text-ink-2">
                      {roleLabel[u.role] ?? u.role}
                    </span>
                    {u.mustChangePassword && (
                      <span className="ml-1 rounded-full bg-status-warning-bg px-2 py-0.5 text-[11.5px] font-semibold text-status-warning">
                        Temp password
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[13px] text-ink-3">
                    {u.email}
                    {u.phone ? ` · ${u.phone}` : ""} · since {fmtDate(u.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setMsg(null);
                    setBusy(`reset-${u.id}`);
                    start(async () => {
                      const res = await resetUserPasswordAction(u.id);
                      setBusy(null);
                      if (res.success) {
                        setSecret({ email: res.email, password: res.tempPassword });
                        router.refresh();
                      } else setMsg({ tone: "err", text: res.error });
                    });
                  }}
                  className={secondaryBtn + " h-9 shrink-0 px-4 text-[13px]"}
                >
                  {spin(`reset-${u.id}`) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <KeyRound className="h-3.5 w-3.5" />}
                  Reset password
                </button>
              </li>
            ))}
          </ul>
        )}

        <form
          className="mt-5 rounded-xl bg-surface-sunken p-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            setBusy("add");
            start(async () => {
              const res = await addAcademyAdminAction({ academyId: academy.id, ...newAdmin });
              setBusy(null);
              if (res.success) {
                setSecret({ email: res.email, password: res.tempPassword });
                setNewAdmin({ name: "", email: "", phone: "" });
                router.refresh();
              } else setMsg({ tone: "err", text: res.error });
            });
          }}
        >
          <p className="flex items-center gap-2 text-[15px] font-semibold text-ink">
            <UserPlus className="h-4 w-4 text-primary" /> Add another admin
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_0.8fr_auto]">
            <input className={fieldClass} placeholder="Full name" value={newAdmin.name} onChange={(e) => setNewAdmin((a) => ({ ...a, name: e.target.value }))} required />
            <input className={fieldClass} type="email" placeholder="Email" value={newAdmin.email} onChange={(e) => setNewAdmin((a) => ({ ...a, email: e.target.value }))} required />
            <input className={fieldClass} type="tel" placeholder="Phone (optional)" value={newAdmin.phone} onChange={(e) => setNewAdmin((a) => ({ ...a, phone: e.target.value }))} />
            <button type="submit" disabled={pending} className={primaryBtn}>
              {spin("add") && <Loader2 className="h-4 w-4 animate-spin" />}
              Add admin
            </button>
          </div>
        </form>
      </ConsoleSection>

      {/* Danger zone */}
      <ConsoleSection
        tone="danger"
        title="Delete academy"
        description="Permanently deletes this academy with all its students, teachers, attendance, fees, results and users. This cannot be undone."
      >
        <form
          className="flex flex-col gap-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            setBusy("delete");
            start(async () => {
              const res = await deleteAcademyAction(academy.id, confirmSlug);
              setBusy(null);
              if (res.success) router.push("/superadmin");
              else setMsg({ tone: "err", text: res.error });
            });
          }}
        >
          <input
            className={fieldClass}
            placeholder={`Type ${academy.slug} to confirm`}
            value={confirmSlug}
            onChange={(e) => setConfirmSlug(e.target.value)}
            aria-label={`Type ${academy.slug} to confirm deletion`}
          />
          <button
            type="submit"
            disabled={pending || confirmSlug.trim().toLowerCase() !== academy.slug}
            className="press inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full bg-status-danger px-5 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {spin("delete") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Delete permanently
          </button>
        </form>
      </ConsoleSection>
    </div>
  );
}
