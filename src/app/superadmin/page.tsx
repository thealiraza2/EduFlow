import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Role, type AcademyPlan, type AcademyStatus } from "@prisma/client";
import { PlatformDashboard, type DashboardAcademy } from "@/components/superadmin/PlatformDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Platform console | EduFlow" };

const PLAN_PRICE_MINOR: Record<AcademyPlan, number> = {
  FREE: 0,
  STARTER: 250000,
  GROWTH: 500000,
  PRO: 900000,
};

export default async function SuperAdminDashboardPage() {
  const superAdmin = await requireSuperAdmin();
  const now = new Date();
  const DAY = 86400000;

  const [academies, totalStudents, totalTeachers, inboxCount, latestMessages] = await Promise.all([
    db.academy.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { students: true, teachers: true } },
        users: { where: { role: Role.ADMIN }, take: 1, orderBy: { createdAt: "asc" }, select: { name: true, email: true } },
      },
    }),
    db.student.count(),
    db.teacher.count(),
    db.contactSubmission.count(),
    db.contactSubmission.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, message: true, createdAt: true },
    }),
  ]);

  const isTrial = (a: { trialEndsAt: Date | null }) => !!a.trialEndsAt && a.trialEndsAt > now;
  const monthlyFee = (a: { plan: AcademyPlan; status: AcademyStatus; trialEndsAt: Date | null }) =>
    a.status !== "ACTIVE" || isTrial(a) ? 0 : PLAN_PRICE_MINOR[a.plan];

  const rows: DashboardAcademy[] = academies.map((a) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    plan: a.plan,
    status: a.status,
    onTrial: isTrial(a),
    trialDaysLeft: isTrial(a) ? Math.ceil((a.trialEndsAt!.getTime() - now.getTime()) / DAY) : null,
    students: a._count.students,
    teachers: a._count.teachers,
    adminName: a.users[0]?.name ?? null,
    adminEmail: a.users[0]?.email ?? null,
    createdAt: a.createdAt.toISOString(),
    monthlyFeeMinor: monthlyFee(a),
  }));

  // KPIs
  const mrrMinor = rows.reduce((s, r) => s + r.monthlyFeeMinor, 0);
  const paying = rows.filter((r) => r.monthlyFeeMinor > 0).length;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = academies.filter((a) => a.createdAt >= startOfMonth).length;
  const trials = rows.filter((r) => r.onTrial);
  const trialsEndingSoon = trials.filter((r) => (r.trialDaysLeft ?? 99) <= 3);

  // Signups for the last 6 calendar months (zero months included — nothing invented)
  const signups = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    const next = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return {
      key: `${d.getFullYear()}-${d.getMonth() + 1}`,
      label: d.toLocaleString("en-US", { month: "short" }),
      count: academies.filter((a) => a.createdAt >= d && a.createdAt < next).length,
    };
  });

  // Plan mix (ordered tiers)
  const planMix = [
    { key: "trial", label: "Trial", count: trials.length },
    { key: "free", label: "Free", count: rows.filter((r) => !r.onTrial && r.plan === "FREE").length },
    { key: "starter", label: "Starter", count: rows.filter((r) => !r.onTrial && r.plan === "STARTER").length },
    { key: "growth", label: "Growth", count: rows.filter((r) => !r.onTrial && r.plan === "GROWTH").length },
    { key: "pro", label: "Pro", count: rows.filter((r) => !r.onTrial && r.plan === "PRO").length },
  ];

  // Things that need the owner's action
  const attention = [
    ...trialsEndingSoon.map((r) => ({
      id: r.id,
      name: r.name,
      kind: "trial" as const,
      detail: `Trial ends in ${r.trialDaysLeft} day${r.trialDaysLeft === 1 ? "" : "s"}`,
    })),
    ...rows
      .filter((r) => r.status === "SUSPENDED")
      .map((r) => ({ id: r.id, name: r.name, kind: "suspended" as const, detail: "Suspended — users can't sign in" })),
    ...rows
      .filter((r) => r.status === "ACTIVE" && r.students === 0 && now.getTime() - new Date(r.createdAt).getTime() > 3 * DAY)
      .map((r) => ({ id: r.id, name: r.name, kind: "setup" as const, detail: "No students added yet — may need onboarding help" })),
  ].slice(0, 6);

  return (
    <PlatformDashboard
      ownerName={superAdmin.name?.split(" ")[0] || "there"}
      today={now.toISOString()}
      kpis={{
        mrrMinor,
        paying,
        academies: rows.length,
        active: rows.filter((r) => r.status === "ACTIVE").length,
        newThisMonth,
        trials: trials.length,
        trialsEndingSoon: trialsEndingSoon.length,
        students: totalStudents,
        teachers: totalTeachers,
      }}
      signups={signups}
      planMix={planMix}
      attention={attention}
      inbox={{
        total: inboxCount,
        latest: latestMessages.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
      }}
      academies={rows}
    />
  );
}
