import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  Clock,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Banknote,
  Award,
  BookOpen,
  Calendar,
  Megaphone,
  QrCode,
  Download,
  ArrowRight,
  School,
  Sparkles,
  MapPin,
  User,
} from "lucide-react";
import Link from "next/link";
import { formatPKR } from "@/lib/money";
import { DAYS_OF_WEEK } from "@/lib/constants";

export const metadata = {
  title: "Student Portal Dashboard | EduFlow",
};

export default async function StudentPortalPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  // 1. Fetch student profile
  let student = await db.student.findFirst({
    where: { userId: user.id },
    include: {
      academy: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              class: true,
              teacher: { include: { user: true } },
              timetableSlots: {
                include: {
                  teacher: { include: { user: true } },
                },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
              tests: {
                where: { status: "PUBLISHED" },
                orderBy: { createdAt: "desc" },
                include: {
                  attempts: {
                    where: {
                      student: { userId: user.id },
                    },
                  },
                },
              },
            },
          },
        },
      },
      invoices: {
        include: {
          payments: true,
          batch: { include: { class: true } },
        },
        orderBy: { month: "desc" },
      },
      testResults: {
        include: {
          test: {
            include: {
              batch: { include: { class: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Admin demonstration fallback if previewing portal without direct student record
  if (!student && (user.role === Role.ADMIN || (user.role as string) === "SUPER_ADMIN")) {
    student = await db.student.findFirst({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: {
        academy: true,
        enrollments: {
          where: { status: "ACTIVE" },
          include: {
            batch: {
              include: {
                class: true,
                teacher: { include: { user: true } },
                timetableSlots: {
                  include: {
                    teacher: { include: { user: true } },
                  },
                  orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
                },
                tests: {
                  where: { status: "PUBLISHED" },
                  orderBy: { createdAt: "desc" },
                  include: {
                    attempts: true,
                  },
                },
              },
            },
          },
        },
        invoices: {
          include: {
            payments: true,
            batch: { include: { class: true } },
          },
          orderBy: { month: "desc" },
        },
        testResults: {
          include: {
            test: {
              include: {
                batch: { include: { class: true } },
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  // 2. Fetch real attendance history and announcements in parallel
  const enrollmentIds = student?.enrollments.map((e) => e.id) || [];
  const [attendanceRecords, announcements] = await Promise.all([
    enrollmentIds.length > 0
      ? db.attendance.findMany({
          where: { enrollmentId: { in: enrollmentIds } },
          orderBy: { date: "desc" },
          take: 30,
        })
      : Promise.resolve([]),
    student
      ? db.announcement.findMany({
          where: {
            academyId: student.academyId,
            audience: { in: ["ALL"] },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : Promise.resolve([]),
  ]);

  const totalSessions = attendanceRecords.length;
  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const leaveCount = attendanceRecords.filter((a) => a.status === "LEAVE").length;
  const attendancePct =
    totalSessions > 0 ? Math.round(((presentCount + lateCount) / totalSessions) * 100) : 0;

  // 4. Extract and classify tests
  const allTests =
    student?.enrollments.flatMap((e) =>
      e.batch.tests.map((t) => ({
        ...t,
        batchName: `${e.batch.class.name} ${e.batch.name}`,
        myAttempt: t.attempts[0] || null,
      }))
    ) || [];

  const pendingTests = allTests.filter((t) => !t.myAttempt && t.durationMinutes !== null);
  const completedTests = allTests.filter((t) => t.myAttempt);

  // 5. Timetable slots
  const allSlots =
    student?.enrollments.flatMap((e) =>
      e.batch.timetableSlots.map((s) => ({
        ...s,
        batchName: `${e.batch.class.name} ${e.batch.name}`,
      }))
    ) || [];

  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  // 6. Fee financial calculation
  const invoices = student?.invoices || [];
  const totalInvoicedMinor = invoices.reduce((acc, inv) => acc + inv.totalMinor, 0);
  const totalPaidMinor = invoices.reduce(
    (acc, inv) => acc + inv.payments.reduce((pAcc, p) => pAcc + p.amountMinor, 0),
    0
  );
  const balanceDueMinor = Math.max(0, totalInvoicedMinor - totalPaidMinor);

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Welcome Header */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Student Portal</h1>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-xs">
                Active Student
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Welcome, <strong>{student?.name || user.name}</strong> • Roll No:{" "}
              <strong className="font-mono text-slate-800">{student?.admissionNo || "—"}</strong>
              {student?.academy && ` • ${student.academy.name}`}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button size="sm" asChild className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs">
              <Link href="/student/attendance/scan">
                <QrCode className="h-4 w-4 mr-1.5" />
                Scan QR Attendance
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
              <span className="text-xs font-medium">Attendance Rate</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {totalSessions > 0 ? `${attendancePct}%` : "—"}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {presentCount} Present / {totalSessions} Sessions
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
              <span className="text-xs font-medium">Fee Balance</span>
              <Banknote className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {formatPKR(balanceDueMinor)}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {invoices.length} {invoices.length === 1 ? "Invoice" : "Invoices"} Recorded
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
              <span className="text-xs font-medium">Active Batches</span>
              <School className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {student?.enrollments.length || 0}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {student?.enrollments.map((e) => e.batch.class.name).join(", ") || "Enrolled"}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0 text-slate-500">
              <span className="text-xs font-medium">Pending Tests</span>
              <FileSpreadsheet className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent className="py-0 px-4 pb-3">
              <div className="text-2xl font-bold text-slate-900 font-mono">
                {pendingTests.length}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {pendingTests.length > 0 ? "Action required" : "All completed"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Assessment Alert Card (NO Trapping: displayed as an interactive card ON dashboard) */}
        {pendingTests.length > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-amber-200/60 rounded-xl text-amber-800">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Pending Online Assessments ({pendingTests.length})
                  </h3>
                  <p className="text-xs text-slate-600">
                    You have assigned online timed examinations ready for evaluation.
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-600 text-white font-mono text-xs">
                Action Required
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {pendingTests.map((t) => (
                <div
                  key={t.id}
                  className="bg-white p-4 rounded-xl border border-amber-200 shadow-sm flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                        {t.subject}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {t.batchName}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 mt-2 text-sm">{t.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 font-mono">
                      <span>⏱️ {t.durationMinutes} mins</span>
                      <span>•</span>
                      <span>🎯 {t.totalMarks} Marks</span>
                      {t.negativeMarking ? (
                        <>
                          <span>•</span>
                          <span className="text-rose-600">-{t.negativeMarking} Neg</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <Button size="sm" asChild className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    <Link href={`/student/test/${t.id}`}>
                      Begin Assessment
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timetable Schedule */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
              Weekly Class Schedule & Timetable
            </CardTitle>
            <CardDescription className="text-xs">
              Live schedule of your enrolled class lectures, teachers, and classroom halls.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayDays.map((day) => {
                const daySlots = allSlots.filter((s) => s.dayOfWeek === day.id);
                return (
                  <div key={day.id} className="border rounded-xl p-3.5 bg-slate-50/30 space-y-2">
                    <div className="flex items-center justify-between border-b pb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                        {day.name}
                      </span>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        {daySlots.length} {daySlots.length === 1 ? "lecture" : "lectures"}
                      </Badge>
                    </div>

                    {daySlots.length === 0 ? (
                      <p className="text-xs text-slate-400 py-3 text-center italic">
                        No scheduled lectures
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {daySlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="bg-white p-2.5 rounded-lg border shadow-xs space-y-1"
                          >
                            <div className="flex justify-between items-start text-xs font-semibold text-slate-900">
                              <span>{slot.subject}</span>
                              <span className="font-mono text-[11px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                {slot.startTime} – {slot.endTime}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[11px] text-slate-500">
                              <span>{slot.teacher?.user?.name || "Faculty Member"}</span>
                              {slot.room && (
                                <span className="flex items-center text-slate-400">
                                  <MapPin className="h-3 w-3 mr-0.5" />
                                  {slot.room}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tests & Assessment Results */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Online Timed Tests Completed / Past */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-amber-600" />
                Online Assessment Tests & Scores
              </CardTitle>
              <CardDescription className="text-xs">
                History of timed tests taken with instant MCQ grading and faculty evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {allTests.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No online tests published for your enrolled batches yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {allTests.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{t.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {t.subject} • {t.batchName} • {t.totalMarks} Marks
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        {t.myAttempt ? (
                          <div className="text-right">
                            <span className="text-sm font-bold font-mono text-emerald-700">
                              {t.myAttempt.score} / {t.totalMarks}
                            </span>
                            <Badge variant="outline" className="ml-2 text-[10px]">
                              {t.myAttempt.status}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-[10px]">
                            Not Taken
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" asChild className="text-xs">
                          <Link href={`/student/test/${t.id}`}>
                            {t.myAttempt ? "Review" : "Take"}
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Paper Exam Results */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Award className="h-5 w-5 mr-2 text-indigo-600" />
                Official Exam & Term Results
              </CardTitle>
              <CardDescription className="text-xs">
                Term assessments, monthly tests, and teacher-graded evaluation marks.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {(student?.testResults?.length || 0) === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No paper examination results published yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                  {student?.testResults.map((r) => (
                    <div
                      key={r.id}
                      className="p-4 flex items-center justify-between hover:bg-slate-50/50 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="font-semibold text-slate-900">{r.test.title}</div>
                        <div className="text-[11px] text-slate-500">
                          {r.test.subject} • Total: {r.test.totalMarks} Marks
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-indigo-700">
                        {r.obtainedMarks} / {r.test.totalMarks}
                        {r.remarks && (
                          <div className="text-[10px] text-slate-400 font-normal">
                            {r.remarks}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Fee Invoices & Payment History */}
        <Card className="shadow-sm">
          <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <Banknote className="h-5 w-5 mr-2 text-emerald-600" />
              Fee Invoices & Challan Slips
            </CardTitle>
            <CardDescription className="text-xs">
              Monthly academy tuition fee vouchers and payment records.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {invoices.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No fee invoices generated yet for your account.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[11px] border-b">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Month</th>
                      <th className="py-3 px-4 font-semibold">Batch</th>
                      <th className="py-3 px-4 font-semibold text-right">Billed Amount</th>
                      <th className="py-3 px-4 font-semibold text-center">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Challan PDF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {inv.month}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {inv.batch ? `${inv.batch.class.name} ${inv.batch.name}` : "General"}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatPKR(inv.totalMinor)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <Badge
                            className={
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : inv.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-rose-100 text-rose-800 border-rose-300"
                            }
                          >
                            {inv.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button variant="outline" size="sm" asChild className="h-7 text-xs">
                            <a
                              href={`/api/invoices/${inv.id}/challan`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Challan
                            </a>
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance Breakdown & Notices */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Attendance Log */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2 text-emerald-600" />
                Recent Daily Attendance Log
              </CardTitle>
              <CardDescription className="text-xs">
                Classroom presence tracked via faculty roll call and student QR scan.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {attendanceRecords.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No attendance sessions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {attendanceRecords.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-50/50 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="font-mono text-slate-700">
                          {att.date.toISOString().split("T")[0]}
                        </span>
                      </div>
                      <Badge
                        className={
                          att.status === "PRESENT"
                            ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                            : att.status === "ABSENT"
                            ? "bg-rose-100 text-rose-800 border-rose-300"
                            : "bg-amber-100 text-amber-800 border-amber-300"
                        }
                      >
                        {att.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notices & Announcements */}
          <Card className="shadow-sm">
            <CardHeader className="py-4 px-6 border-b bg-slate-50/50">
              <CardTitle className="text-base font-bold text-slate-900 flex items-center">
                <Megaphone className="h-5 w-5 mr-2 text-blue-600" />
                Academy Notice Board
              </CardTitle>
              <CardDescription className="text-xs">
                Official circulars and announcements from academy administration.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {announcements.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No notices posted at this time.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {announcements.map((anc) => (
                    <div key={anc.id} className="p-4 space-y-1 hover:bg-slate-50/50 text-xs">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900">{anc.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {anc.createdAt.toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs leading-relaxed">{anc.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
