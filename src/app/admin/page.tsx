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
} from "lucide-react";

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
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 border-t-4 border-t-[#F5B800] shadow-sm card-lift relative overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F2040]">
              Admin Control Center
            </h1>
            <Badge className="border-emerald-300 text-emerald-800 bg-emerald-50 text-xs font-semibold px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1.5 animate-pulse" />
              Live Operations
            </Badge>
          </div>
          <p className="text-slate-600 text-sm mt-1.5">
            Academy snapshot for <strong className="text-[#0F2040]">{currentMonth}</strong> • Logged in as <span className="font-semibold text-slate-800">{admin.name}</span> ({admin.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/admin/boards">
            <Button size="sm" variant="outline" className="text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <School className="h-4 w-4 mr-1.5 text-indigo-600" />
              Boards &amp; Schemes
            </Button>
          </Link>
          <Link href="/admin/fees">
            <Button size="sm" variant="outline" className="text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <Banknote className="h-4 w-4 mr-1.5 text-emerald-600" />
              Collect Fees
            </Button>
          </Link>
          <Link href="/admin/salaries">
            <Button size="sm" variant="outline" className="text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <Wallet className="h-4 w-4 mr-1.5 text-blue-600" />
              Faculty Salaries
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm" className="bg-[#0F2040] hover:bg-[#1B3466] text-white text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-[#F5B800]" />
              Export Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* KPI 1: Fee Collection */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-emerald-500 bg-white card-lift p-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Monthly Fee Collection
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Banknote className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-600 mt-1">
              <CountUp value={collectedMinor / 100} prefix="PKR " />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>Billed Dues:</span>
              <span className="font-mono font-medium text-slate-800">
                <CountUp value={totalDueMinor / 100} prefix="PKR " />
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(100, collectionPct)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-2">
              <span className="font-medium">
                <CountUp value={collectionPct} suffix="%" /> collected
              </span>
              <Link href="/admin/fees" className="text-emerald-700 font-semibold hover:underline inline-flex items-center">
                Ledger &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Defaulters */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-rose-500 bg-white card-lift p-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Fee Defaulters
              </span>
              <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-600 mt-1">
              <CountUp value={defaultersCount} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              Students past invoice payment due date
            </p>
            <div className="mt-4">
              <Link
                href="/admin/fees/defaulters"
                className="text-xs font-bold text-rose-700 hover:text-rose-900 inline-flex items-center gap-1 group"
              >
                <span>View Defaulters</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Today's Attendance */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-blue-500 bg-white card-lift p-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today's Attendance
              </span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-blue-600 mt-1">
              {todayAttendancePct !== null ? (
                <CountUp value={todayAttendancePct} suffix="%" />
              ) : (
                <span className="text-lg text-slate-400 font-sans font-medium">No sessions</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {todayAttendances.length > 0
                ? `${todayPresentCount} of ${todayAttendances.length} marked present`
                : "No sessions marked yet today"}
            </p>
            <div className="mt-4">
              <Link
                href="/admin/attendance"
                className="text-xs font-bold text-blue-700 hover:text-blue-900 inline-flex items-center gap-1 group"
              >
                <span>Attendance Register</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Academy Enrollment */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm border-l-4 border-l-indigo-500 bg-white card-lift p-1">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Academy Roster
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-extrabold font-mono text-[#0F2040] mt-1">
              <CountUp value={activeStudentsCount} />
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-500">
              {activeBatchesCount} Batches • {totalTeachersCount} Faculty Members
            </div>
            <div className="mt-4">
              <Link
                href="/admin/students"
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 inline-flex items-center gap-1 group"
              >
                <span>Student Admissions</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Dropout Risk & Academic Retention Analysis */}
      <AtRiskStudentsCard students={atRiskStudents} isAiAvailable={isAiAvailable} />

      {/* Middle Row: Low Attendance (<75%) & Upcoming Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low-Attendance Students Alert Card */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden card-lift bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-amber-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  At-Risk Students (&lt;75% Attendance)
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-100 text-amber-800 text-[11px] font-mono font-bold"
              >
                {lowAttendanceStudents.length} Students
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Students falling below the statutory 75% attendance threshold for {currentMonth}.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {lowAttendanceStudents.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-400" />
                Excellent! All enrolled students maintain &ge;75% attendance this month.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {lowAttendanceStudents.map((st) => (
                  <div
                    key={st.studentId}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/75 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900">
                        {st.name}{" "}
                        <span className="font-mono text-slate-400 font-normal">
                          ({st.admissionNo})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {st.batchName} • Guardian: {st.guardianPhone || "No phone"}
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs font-mono font-bold">
                        {st.percentage}%
                      </Badge>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {st.presentSessions}/{st.totalSessions} sessions
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-right">
            <Link
              href="/admin/attendance"
              className="text-xs text-slate-700 hover:text-[#0F2040] font-semibold inline-flex items-center gap-1 group"
            >
              <span>Full Attendance Monitor</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Card>

        {/* Tests & Academic Evaluations */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between overflow-hidden card-lift bg-white">
          <CardHeader className="pb-3 border-b border-slate-100 bg-purple-50/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Academic Evaluations &amp; Tests
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono font-semibold">
                {recentTests.length} Tests
              </Badge>
            </div>
            <CardDescription className="text-xs text-slate-500">
              Scheduled tests, recent test drafts, and published examination result cards.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex-1">
            {recentTests.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-400 italic">
                <Award className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                No tests scheduled or conducted yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {recentTests.map((t) => (
                  <div
                    key={t.id}
                    className="p-3.5 flex items-center justify-between hover:bg-slate-50/75 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-xs text-slate-900 flex items-center">
                        {t.title}
                        <span className="ml-2 text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded font-semibold">
                          {t.subject}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t.batch.class.name} {t.batch.name} • Total: {t.totalMarks} marks
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-2">
                      <span className="text-[11px] font-mono text-slate-500">
                        {t.date.toISOString().split("T")[0]}
                      </span>
                      <Badge
                        variant={t.status === "PUBLISHED" ? "default" : "outline"}
                        className={`text-[10px] font-semibold py-0.5 px-2 ${
                          t.status === "PUBLISHED"
                            ? "bg-purple-600 text-white"
                            : "bg-amber-50 text-amber-700 border-amber-300"
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <div className="p-3 bg-slate-50/80 border-t border-slate-100 text-right">
            <Link
              href="/admin/results"
              className="text-xs text-slate-700 hover:text-[#0F2040] font-semibold inline-flex items-center gap-1 group"
            >
              <span>Manage Results &amp; Publish Cards</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Announcements Section */}
      <AdminAnnouncementsCard initialAnnouncements={serializedAnnouncements} />
    </div>
  );
}
