import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Clock, MapPin, School, Calendar, BookOpen, CheckCircle2, FileSpreadsheet, FileCheck2, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnnouncementsFeed } from "@/components/common/AnnouncementsFeed";
import { AtRiskStudentsCard } from "@/components/common/AtRiskStudentsCard";
import { getAcademyStudentsRiskOverview } from "@/lib/risk";
import { CountUp } from "@/components/common/CountUp";

export default async function TeacherDashboardPage() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  // Find the teacher profile
  let teacher = await db.teacher.findFirst({
    where: {
      userId: user.id,
      ...(user.academyId ? { academyId: user.academyId } : {}),
    },
    include: {
      user: true,
      batches: {
        include: { class: true },
      },
    },
  });

  // If viewing as admin without a direct teacher profile, fetch the first available teacher for demonstration
  if (!teacher && (user.role === Role.ADMIN || (user.role as string) === "SUPER_ADMIN")) {
    teacher = await db.teacher.findFirst({
      where: user.academyId ? { academyId: user.academyId } : {},
      include: {
        user: true,
        batches: {
          include: { class: true },
        },
      },
    });
  }

  const teacherBatchIds = teacher ? teacher.batches.map((b) => b.id) : [];

  // Fetch slots, announcements, and at-risk students in parallel
  const [slots, announcements, atRiskStudents] = await Promise.all([
    teacher
      ? db.timetableSlot.findMany({
          where: {
            teacherId: teacher.id,
            ...(user.academyId ? { academyId: user.academyId } : {}),
          },
          include: {
            batch: {
              include: {
                class: true,
              },
            },
          },
          orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
        })
      : Promise.resolve([]),
    db.announcement.findMany({
      where: {
        audience: { in: ["ALL", "TEACHERS"] },
        ...(user.academyId ? { academyId: user.academyId } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    getAcademyStudentsRiskOverview(
      user.academyId || "",
      teacherBatchIds.length > 0 ? teacherBatchIds : undefined
    ),
  ]);

  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  const serializedAnnouncements = announcements.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    audience: a.audience,
    createdAt: a.createdAt.toISOString(),
  }));

  const isAiAvailable = !!process.env.LLM_API_KEY?.trim();

  // Compute greeting
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  // Compute today's slot count
  const todayDayId = new Date().getDay(); // 0=Sun,1=Mon,...
  const todaySlots = slots.filter((s) => s.dayOfWeek === todayDayId);

  // Total students across batches (unique enrollments count not available here, use batch count as proxy)
  const totalBatches = teacher?.batches.length ?? 0;

  return (
    <div className="space-y-7 max-w-7xl mx-auto w-full">
      {/* Top Welcome Banner */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5 bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/80 border-t-4 border-t-[#F5B800] shadow-sm card-lift relative overflow-hidden">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F2040]">
              {greeting}, {teacher?.user?.name || user.name}
            </h1>
            <Badge className="border-amber-300 text-amber-900 bg-amber-50 text-xs font-semibold px-2.5 py-0.5">
              Faculty Workspace
            </Badge>
          </div>
          <p className="text-sm text-slate-600 mt-1.5">
            You have{" "}
            <span className="font-extrabold text-[#0F2040]">{totalBatches}</span>{" "}
            assigned {totalBatches === 1 ? "batch" : "batches"} this academic term
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link href="/teacher/tests/generate">
            <Button size="sm" className="bg-[#F5B800] hover:bg-[#DF9E00] text-[#0F2040] font-bold flex items-center text-xs shadow-sm whitespace-nowrap focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <Sparkles className="h-4 w-4 mr-1.5" />
              AI Test Generator
            </Button>
          </Link>
          <Link href="/teacher/marking">
            <Button size="sm" variant="outline" className="flex items-center text-xs font-semibold text-[#0F2040] border-slate-200 hover:bg-[#FFF9E6] whitespace-nowrap shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <FileCheck2 className="h-4 w-4 mr-1.5 text-[#F5B800]" />
              Marking Queue
            </Button>
          </Link>
          <Link href="/teacher/tests">
            <Button size="sm" variant="outline" className="flex items-center text-xs font-semibold text-slate-700 border-slate-200 hover:bg-slate-50 whitespace-nowrap shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <FileSpreadsheet className="h-4 w-4 mr-1.5 text-[#0F2040]" />
              Tests &amp; Marks
            </Button>
          </Link>
          <Link href="/teacher/attendance">
            <Button size="sm" className="bg-[#0F2040] hover:bg-[#1B3466] text-white flex items-center whitespace-nowrap text-xs font-semibold shadow-sm focus-visible:ring-2 focus-visible:ring-[#F5B800]">
              <CheckCircle2 className="h-4 w-4 mr-1.5 text-[#F5B800]" />
              Mark Attendance
            </Button>
          </Link>
        </div>
      </div>

      {/* Stat Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Assigned Batches */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-start gap-4 card-lift">
          <div className="bg-[#FFF9E6] border border-[#F5B800]/30 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="h-6 w-6 text-[#F5B800]" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Assigned Batches</p>
            <p className="text-3xl font-extrabold text-[#0F2040] mt-1">
              <CountUp value={totalBatches} />
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Active teaching cohorts</p>
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-start gap-4 card-lift">
          <div className="bg-amber-50 border border-amber-200/50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <Users className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">At-Risk Students</p>
            <p className="text-3xl font-extrabold text-[#0F2040] mt-1">
              <CountUp value={atRiskStudents.length} />
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">Low attendance or test alerts</p>
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex items-start gap-4 card-lift">
          <div className="bg-blue-50 border border-blue-200/50 w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Today&apos;s Lectures</p>
            <p className="text-3xl font-extrabold text-[#0F2040] mt-1">
              <CountUp value={todaySlots.length} />
            </p>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              {todaySlots.length === 0 ? "No lectures scheduled today" : `${todaySlots.length} session${todaySlots.length > 1 ? "s" : ""} today`}
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Timetable */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden card-lift">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-base font-bold text-[#0F2040] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#F5B800]" />
              My Timetable This Week
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Weekly scheduled lectures and classroom assignments</p>
          </div>
          <span className="text-xs font-bold text-[#0F2040] bg-[#FFF9E6] px-3.5 py-1.5 rounded-full border border-[#F5B800]/40 shadow-xs">
            <CountUp value={slots.length} /> Total Lectures
          </span>
        </div>
          <div className="p-6">
            {!teacher ? (
              <p className="text-center text-gray-500 py-8">
                No active faculty profile linked to this user account.
              </p>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-gray-400 italic">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                You do not have any lectures scheduled on your timetable this week.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {displayDays.map((day) => {
                  const daySlots = slots.filter((s) => s.dayOfWeek === day.id);
                  const isToday = day.id === todayDayId;

                  return (
                    <div
                      key={day.id}
                      className={`border rounded-lg bg-white overflow-hidden flex flex-col min-h-[220px] ${
                        isToday ? "border-[#F5B800] shadow-md" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`font-semibold text-center text-xs py-2 border-b ${
                          isToday
                            ? "bg-[#FFF9E6] text-[#0F2040]"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {day.name}
                        {isToday && (
                          <span className="ml-1 text-[#F5B800] font-bold">●</span>
                        )}
                      </div>

                      <div className="p-2.5 flex-1 space-y-2">
                        {daySlots.length === 0 ? (
                          <div className="text-[11px] text-gray-400 text-center py-6 italic">
                            Off
                          </div>
                        ) : (
                          daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-2.5 rounded border border-gray-200 bg-white shadow-sm space-y-1.5"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#FFF9E6] text-[#0F2040] font-semibold border border-[#F5B800]/30">
                                  {slot.subject}
                                </span>
                              </div>

                              <div className="text-xs font-mono font-semibold text-[#0F2040] flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {slot.startTime} – {slot.endTime}
                              </div>

                              <div className="text-[11px] text-gray-600 flex items-center">
                                <School className="h-3 w-3 mr-1 text-gray-400" />
                                <span>
                                  {slot.batch.class.name}-{slot.batch.class.section}
                                </span>
                              </div>

                              {slot.room && (
                                <div className="text-[10px] text-gray-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                  <span>{slot.room}</span>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* At-Risk Students */}
        <AtRiskStudentsCard
          students={atRiskStudents}
          isAiAvailable={isAiAvailable}
          title="My Students Retention &amp; Risk Alert"
          description="Deterministic dropout risk for students enrolled in your assigned batches."
        />

        {/* Announcements */}
        <AnnouncementsFeed
          announcements={serializedAnnouncements}
          title="Academy Notices for Faculty"
        />
      </div>
  );
}
