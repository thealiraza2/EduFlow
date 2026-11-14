import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/money";
import { calculateRemainingBalance } from "@/lib/fees";
import { AdminAnnouncementsCard } from "@/components/admin/AdminAnnouncementsCard";
import { AtRiskStudentsCard } from "@/components/common/AtRiskStudentsCard";
import { getAcademyStudentsRiskOverview } from "@/lib/risk";
import Link from "next/link";
import {
  Users,
  GraduationCap,
  School,
  Banknote,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Award,
  Wallet,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
  Clock,
  UserX,
  Phone,
} from "lucide-react";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // 1. Fee collection for current month (collected vs due)
  const currentMonthInvoices = await db.feeInvoice.findMany({
    where: {
      academyId: tenant.academyId,
      month: currentMonth,
    },
    include: {
      payments: true,
    },
  });

  const totalDueMinor = currentMonthInvoices.reduce((sum, inv) => sum + inv.totalMinor, 0);
  const collectedMinor = currentMonthInvoices.reduce((sum, inv) => {
    return sum + inv.payments.reduce((pSum, p) => pSum + p.amountMinor, 0);
  }, 0);
  const collectionPct =
    totalDueMinor > 0 ? Math.round((collectedMinor / totalDueMinor) * 100) : 0;

  // 2. Defaulters count (unpaid/partial past due date)
  const unpaidInvoices = await db.feeInvoice.findMany({
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
  });

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

  // 3. Today's attendance %
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const todayAttendances = await db.attendance.findMany({
    where: {
      academyId: tenant.academyId,
      date: { gte: startOfDay, lte: endOfDay },
    },
  });

  const todayPresentCount = todayAttendances.filter(
    (a) => a.status === "PRESENT" || a.status === "LATE"
  ).length;
  const todayAttendancePct =
    todayAttendances.length > 0
      ? Math.round((todayPresentCount / todayAttendances.length) * 1000) / 10
      : null;

  // 4. Active students & active batches
  const [activeStudentsCount, activeBatchesCount, totalTeachersCount] = await Promise.all([
    db.student.count({ where: { academyId: tenant.academyId, status: "ACTIVE" } }),
    db.batch.count({ where: { academyId: tenant.academyId } }),
    db.teacher.count({ where: { academyId: tenant.academyId, status: "ACTIVE" } }),
  ]);

  // 5. Upcoming / recent tests
  const upcomingTests = await db.test.findMany({
    where: {
      academyId: tenant.academyId,
      date: { gte: startOfDay },
    },
    include: {
      batch: {
        include: { class: true },
      },
    },
    orderBy: { date: "asc" },
    take: 4,
  });

  const recentTests =
    upcomingTests.length > 0
      ? upcomingTests
      : await db.test.findMany({
          where: { academyId: tenant.academyId },
          include: {
            batch: {
              include: { class: true },
            },
          },
          orderBy: { date: "desc" },
          take: 4,
        });

  // 6. Low-attendance students (<75% for current month)
  const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = new Date(
    Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  );

  const monthlyEnrollments = await db.enrollment.findMany({
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
  });

  const lowAttendanceStudents = monthlyEnrollments
    .map((enr) => {
      const total = enr.attendance.length;
      const present = enr.attendance.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 100;
      return {
        studentId: enr.student.id,
        name: enr.student.name,
        admissionNo: enr.student.admissionNo,
        batchName: `${enr.batch.class.name} ${enr.batch.name}`,
        guardianPhone: enr.student.guardianPhone,
        totalSessions: total,
        presentSessions: present,
        percentage: pct,
        isAtRisk: total > 0 && pct < 75,
      };
    })
    .filter((s) => s.isAtRisk);

  // 7. Recent Announcements
  const recentAnnouncements = await db.announcement.findMany({
    where: { academyId: tenant.academyId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const serializedAnnouncements = recentAnnouncements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
  }));

  // 8. AI Dropout Risk & Academic Retention Analysis (Phase 13)
  const atRiskStudents = await getAcademyStudentsRiskOverview(tenant.academyId);
  const isAiAvailable = !!process.env.LLM_API_KEY?.trim();

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Control Center</h1>
            <Badge variant="outline" className="border-emerald-300 text-emerald-800 bg-emerald-50">
              Live Operations
            </Badge>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Academy snapshot for <strong>{currentMonth}</strong> • Logged in as {admin.name} ({admin.email})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/boards">
            <Button size="sm" variant="outline" className="text-xs">
              <School className="h-4 w-4 mr-1 text-indigo-600" />
              Boards & Schemes
            </Button>
          </Link>
          <Link href="/admin/fees">
            <Button size="sm" variant="outline" className="text-xs">
              <Banknote className="h-4 w-4 mr-1 text-emerald-600" />
              Collect Fees
            </Button>
          </Link>
          <Link href="/admin/salaries">
            <Button size="sm" variant="outline" className="text-xs">
              <Wallet className="h-4 w-4 mr-1 text-blue-600" />
              Faculty Salaries
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs">
              <FileSpreadsheet className="h-4 w-4 mr-1" />
              Export Reports
            </Button>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Fee Collection */}
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Monthly Fee Collection
              </span>
              <Banknote className="h-5 w-5 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {formatPKR(collectedMinor)}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-500 flex justify-between items-center">
              <span>Billed Dues:</span>
              <span className="font-mono font-medium text-slate-700">
                {formatPKR(totalDueMinor)}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, collectionPct)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400 mt-1">
              <span>{collectionPct}% collected</span>
              <Link href="/admin/fees" className="text-emerald-700 hover:underline">
                View Ledger &rarr;
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Defaulters */}
        <Card className="shadow-sm border-l-4 border-l-rose-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Fee Defaulters
              </span>
              <AlertTriangle className="h-5 w-5 text-rose-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-rose-600 mt-1">
              {defaultersCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              Students past invoice payment due date
            </p>
            <div className="mt-3">
              <Link
                href="/admin/fees/defaulters"
                className="text-xs font-medium text-rose-700 hover:text-rose-900 inline-flex items-center"
              >
                Send Reminders <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Today's Attendance */}
        <Card className="shadow-sm border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Today's Attendance
              </span>
              <CheckCircle2 className="h-5 w-5 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-blue-600 mt-1">
              {todayAttendancePct !== null ? `${todayAttendancePct}%` : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-slate-500">
              {todayAttendances.length > 0
                ? `${todayPresentCount} of ${todayAttendances.length} marked present`
                : "No sessions marked yet today"}
            </p>
            <div className="mt-3">
              <Link
                href="/admin/attendance"
                className="text-xs font-medium text-blue-700 hover:text-blue-900 inline-flex items-center"
              >
                Attendance Register <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Academy Enrollment */}
        <Card className="shadow-sm border-l-4 border-l-indigo-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold uppercase text-slate-500">
                Academy Roster
              </span>
              <Users className="h-5 w-5 text-indigo-600" />
            </div>
            <CardTitle className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {activeStudentsCount}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-xs text-slate-500">
              {activeBatchesCount} Batches • {totalTeachersCount} Faculty Members
            </div>
            <div className="mt-3">
              <Link
                href="/admin/students"
                className="text-xs font-medium text-indigo-700 hover:text-indigo-900 inline-flex items-center"
              >
                Student Admissions <ArrowRight className="h-3 w-3 ml-1" />
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
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-amber-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserX className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  At-Risk Students (&lt;75% Attendance)
                </CardTitle>
              </div>
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-100 text-amber-800 text-[11px] font-mono"
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

          <div className="p-3 bg-slate-50 border-t text-right">
            <Link
              href="/admin/attendance"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center"
            >
              Full Attendance Monitor <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </Card>

        {/* Tests & Academic Evaluations */}
        <Card className="shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-purple-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-sm font-bold text-slate-900">
                  Academic Evaluations & Tests
                </CardTitle>
              </div>
              <Badge variant="outline" className="text-[11px] font-mono">
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
                        <span className="ml-2 text-[10px] font-mono bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
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

          <div className="p-3 bg-slate-50 border-t text-right">
            <Link
              href="/admin/results"
              className="text-xs text-slate-600 hover:text-slate-900 font-medium inline-flex items-center"
            >
              Manage Results & Publish Cards <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </div>
        </Card>
      </div>

      {/* Announcements Section */}
      <AdminAnnouncementsCard initialAnnouncements={serializedAnnouncements} />
    </div>
  );
}
