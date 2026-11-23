import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatPKR } from "@/lib/money";
import { calculateRemainingBalance } from "@/lib/fees";
import { AdminAnnouncementsCard } from "@/components/admin/AdminAnnouncementsCard";
import { AtRiskStudentsCard } from "@/components/common/AtRiskStudentsCard";
import { getAcademyStudentsRiskOverview } from "@/lib/risk";
import { CountUp } from "@/components/common/CountUp";
import { ButtonLink, EmptyState, HeroFigure, HeroPanel, PageHeader, Panel, RadialStat, ActionTile, StatusPill } from "@/components/dashboard/kit";
import { NumberTicker } from "@/components/magicui";
import Link from "next/link";
import {
  Users,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Award,
  FileSpreadsheet,
  ArrowRight,
  UserX,
  GraduationCap,
  School,
  Wallet,
  Sparkles,
} from "@/components/icons";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  );

  // Parallelize all dashboard queries in a single concurrent batch
  const [
    currentMonthInvoices,
    unpaidInvoices,
    todayAttendances,
    activeStudentsCount,
    activeBatchesCount,
    totalTeachersCount,
    testsData,
    monthlyEnrollments,
    recentAnnouncements,
    atRiskStudents,
  ] = await Promise.all([
    // 1. Fee collection for current month
    db.feeInvoice.findMany({
      where: {
        academyId: tenant.academyId,
        month: currentMonth,
      },
      include: {
        payments: true,
      },
    }),
    // 2. Defaulters
    db.feeInvoice.findMany({
      where: {
        academyId: tenant.academyId,
        status: { in: ["UNPAID", "PARTIAL"] },
      },
      include: {
        batch: {
          include: { feePlan: true },
        },
        payments: true,
      },
    }),
    // 3. Today's attendance
    db.attendance.findMany({
      where: {
        academyId: tenant.academyId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    }),
    // 4. Counts
    db.student.count({ where: { academyId: tenant.academyId, status: "ACTIVE" } }),
    db.batch.count({ where: { academyId: tenant.academyId } }),
    db.teacher.count({ where: { academyId: tenant.academyId, status: "ACTIVE" } }),
    // 5. Tests
    db.test.findMany({
      where: { academyId: tenant.academyId },
      include: {
        batch: {
          include: { class: true },
        },
      },
      orderBy: { date: "desc" },
      take: 4,
    }),
    // 6. Monthly Enrollments for attendance check
    db.enrollment.findMany({
      where: {
        academyId: tenant.academyId,
        status: "ACTIVE",
        student: { status: "ACTIVE" },
      },
      include: {
        student: true,
        batch: {
          include: { class: true },
        },
        attendance: {
          where: {
            date: { gte: monthStart, lte: monthEnd },
          },
        },
      },
    }),
    // 7. Recent Announcements
    db.announcement.findMany({
      where: { academyId: tenant.academyId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    // 8. Academic Retention Analysis
    getAcademyStudentsRiskOverview(tenant.academyId),
  ]);

  const totalDueMinor = currentMonthInvoices.reduce((sum, inv) => sum + inv.totalMinor, 0);
  const collectedMinor = currentMonthInvoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((pSum, p) => pSum + p.amountMinor, 0);
  }, 0);
  const collectionPct =
    totalDueMinor > 0 ? Math.round((collectedMinor / totalDueMinor) * 100) : 0;

  let defaultersCount = 0;
  for (const inv of unpaidInvoices) {
    const dueDay = inv.batch.feePlan?.dueDayOfMonth ?? 10;
    const [yearStr, monthStr] = inv.month.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const dueDate = new Date(year, month, dueDay, 23, 59, 59, 999);

    if (now.getTime() > dueDate.getTime()) {
      const paidMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
      const remainingMinor = calculateRemainingBalance(inv.totalMinor, paidMinor);
      if (remainingMinor > 0) {
        defaultersCount++;
      }
    }
  }

  const todayPresentCount = todayAttendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const todayAttendancePct =
    todayAttendances.length > 0
      ? Math.round((todayPresentCount / todayAttendances.length) * 1000) / 10
      : null;

  const recentTests = testsData;

  const lowAttendanceStudents = monthlyEnrollments
    .map((enr) => {
      const total = enr.attendance.length;
      const present = enr.attendance.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : null;
      return {
        studentId: enr.student.id,
        name: enr.student.name,
        admissionNo: enr.student.admissionNo,
        batchName: `${enr.batch.class.name} ${enr.batch.name}`,
        guardianPhone: enr.student.guardianPhone,
        totalSessions: total,
        presentSessions: present,
        percentage: pct,
        isAtRisk: total > 0 && pct !== null && pct < 75,
      };
    })
    .filter((s) => s.isAtRisk);

  const serializedAnnouncements = recentAnnouncements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
  }));

  const isAiAvailable = !!process.env.LLM_API_KEY?.trim();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={now.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={tenant.academy.name}
        description={<>Signed in as <strong className="font-semibold text-ink">{admin.name}</strong></>}
        actions={
          <>
            <ButtonLink href="/admin/fees" variant="secondary" icon={Banknote}>Collect fees</ButtonLink>
            <ButtonLink href="/admin/reports" variant="secondary" icon={FileSpreadsheet}>Reports</ButtonLink>
            <ButtonLink href="/admin/students" icon={Users}>Admit student</ButtonLink>
          </>
        }
      />

      <HeroPanel
        title="Today at a glance"
        subtitle={todayAttendances.length > 0 ? `${todayPresentCount} of ${todayAttendances.length} students marked present so far` : "Attendance hasn't been marked yet today"}
        aside={<RadialStat value={todayAttendancePct ?? 0} label="Present today" />}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-[1.7fr_1fr_1fr_1fr] [&>*:first-child]:col-span-2 md:[&>*:first-child]:col-span-1">
          <HeroFigure
            label="Fees collected this month"
            value={<NumberTicker value={collectedMinor / 100} prefix="PKR " />}
            hint={`${collectionPct}% of ${formatPKR(totalDueMinor)} billed`}
          />
          <HeroFigure label="Fee defaulters" value={<NumberTicker value={defaultersCount} />} hint="Past their due date" />
          <HeroFigure
            label="Active students"
            value={<NumberTicker value={activeStudentsCount} />}
            hint={`${activeBatchesCount} batches`}
          />
          <HeroFigure label="Teachers" value={<NumberTicker value={totalTeachersCount} />} hint="Active this term" />
        </div>
      </HeroPanel>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
        <ActionTile title="Collect a fee" body="Record cash, bank or wallet payments" icon={Banknote} tone="success" href="/admin/fees" />
        <ActionTile title="Follow up defaulters" body="Call or message overdue families" icon={AlertTriangle} tone="danger" href="/admin/fees/defaulters" />
        <ActionTile title="Today's register" body="See who is in and who is absent" icon={CheckCircle2} tone="info" href="/admin/attendance" />
        <ActionTile title="Publish results" body="Lock marks and share result cards" icon={Award} tone="plum" href="/admin/results" />
      </div>

      <AtRiskStudentsCard students={atRiskStudents} isAiAvailable={isAiAvailable} />

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <Panel
          title="Low attendance"
          description={`Below 75% in ${currentMonth}`}
          action={<StatusPill tone={lowAttendanceStudents.length ? "warning" : "success"}>{lowAttendanceStudents.length} students</StatusPill>}
          flush
        >
          {lowAttendanceStudents.length === 0 ? (
            <EmptyState icon={CheckCircle2} title="Everyone is above 75%" body="No student needs an attendance follow-up this month." />
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {lowAttendanceStudents.map((st) => (
                <li key={st.studentId} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold text-ink">
                      {st.name} <span className="font-mono text-[12px] font-normal text-ink-3">{st.admissionNo}</span>
                    </p>
                    <p className="truncate text-[13px] text-ink-3">
                      {st.batchName} · {st.guardianPhone || "No phone"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill tone="danger">{st.percentage}%</StatusPill>
                    <p className="mt-0.5 text-[12px] tabular-nums text-ink-3">{st.presentSessions}/{st.totalSessions}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-4 py-3 text-right sm:px-5">
            <Link href="/admin/attendance" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
              Attendance register <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>

        <Panel
          title="Tests & results"
          description="Latest tests across all batches"
          action={<StatusPill tone="plum">{recentTests.length} tests</StatusPill>}
          flush
        >
          {recentTests.length === 0 ? (
            <EmptyState icon={Award} title="No tests yet" body="Tests created by teachers will appear here." />
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {recentTests.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-[14.5px] font-semibold text-ink">{t.title}</p>
                    <p className="truncate text-[13px] text-ink-3">
                      {t.subject} · {t.batch.class.name} {t.batch.name} · {t.totalMarks} marks
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <StatusPill tone={t.status === "PUBLISHED" ? "success" : "warning"}>
                      {t.status === "PUBLISHED" ? "Published" : "Draft"}
                    </StatusPill>
                    <p className="mt-0.5 text-[12px] tabular-nums text-ink-3">{t.date.toISOString().split("T")[0]}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="border-t border-line px-4 py-3 text-right sm:px-5">
            <Link href="/admin/results" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline">
              Manage results <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </Panel>
      </div>

      <AdminAnnouncementsCard initialAnnouncements={serializedAnnouncements} />
    </div>
  );
}