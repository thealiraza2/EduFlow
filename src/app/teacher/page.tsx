import { ActionTile, ButtonLink, HeroFigure, HeroPanel, PageHeader } from "@/components/dashboard/kit";
import { NumberTicker } from "@/components/magicui";
import { requireClassroomRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Clock, MapPin, School, Calendar, BookOpen, CheckCircle2, FileSpreadsheet, FileCheck2, Sparkles, Users } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AnnouncementsFeed } from "@/components/common/AnnouncementsFeed";
import { AtRiskStudentsCard } from "@/components/common/AtRiskStudentsCard";
import { getAcademyStudentsRiskOverview } from "@/lib/risk";
import { CountUp } from "@/components/common/CountUp";

export default async function TeacherDashboardPage() {
  const user = await requireClassroomRole();

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
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Compute today's slot count
  const todayDayId = new Date().getDay(); // 0=Sun,1=Mon,...
  const todaySlots = slots.filter((s) => s.dayOfWeek === todayDayId);

  // Total students across batches (unique enrollments count not available here, use batch count as proxy)
  const totalBatches = teacher?.batches.length ?? 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6">
      <PageHeader
        eyebrow={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
        title={`${greeting}, ${(teacher?.user?.name || user.name || "").split(" ")[0]}`}
        description={`You teach ${totalBatches} ${totalBatches === 1 ? "batch" : "batches"} this term.`}
        actions={
          <>
            <ButtonLink href="/teacher/papers/new" variant="secondary" icon={Sparkles}>Paper generator</ButtonLink>
            <ButtonLink href="/teacher/attendance" icon={CheckCircle2}>Mark attendance</ButtonLink>
          </>
        }
      />

      <HeroPanel
        title="Your day"
        subtitle={todaySlots.length === 0 ? "No lectures on your timetable today" : `First lecture at ${[...todaySlots].sort((a, b) => a.startTime.localeCompare(b.startTime))[0]!.startTime}`}
      >
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-4">
          <HeroFigure label="Lectures today" value={<NumberTicker value={todaySlots.length} />} hint={`${slots.length} this week`} />
          <HeroFigure label="Your batches" value={<NumberTicker value={totalBatches} />} hint="Active this term" />
          <HeroFigure label="Students needing attention" value={<NumberTicker value={atRiskStudents.length} />} hint="Low attendance or marks" />
          <HeroFigure label="Notices" value={<NumberTicker value={serializedAnnouncements.length} />} hint="From your academy" />
        </div>
      </HeroPanel>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 [&>*]:min-w-0">
        <ActionTile title="Mark attendance" body="Take today's register in seconds" icon={CheckCircle2} tone="success" href="/teacher/attendance" />
        <ActionTile title="Marking queue" body="Grade short answers waiting for you" icon={FileCheck2} tone="warning" href="/teacher/marking" />
        <ActionTile title="Tests & marks" body="Create tests and enter marks" icon={FileSpreadsheet} tone="info" href="/teacher/tests" />
        <ActionTile title="Paper generator" body="Draft a board-style paper" icon={Sparkles} tone="plum" href="/teacher/papers/new" />
      </div>
      {/* Weekly Timetable */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-1 overflow-hidden card-lift">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-slate-50/50">
          <div>
            <h2 className="text-base font-semibold text-ink flex items-center gap-2">
              <Calendar className="h-5 w-5 text-accent" />
              My Timetable This Week
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Weekly scheduled lectures and classroom assignments</p>
          </div>
          <span className="text-xs font-semibold text-ink bg-primary-tint px-3.5 py-1.5 rounded-full border border-primary/40 shadow-xs">
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
                        isToday ? "border-primary shadow-2" : "border-gray-200"
                      }`}
                    >
                      <div
                        className={`font-semibold text-center text-xs py-2 border-b ${
                          isToday
                            ? "bg-primary-tint text-ink"
                            : "bg-gray-50 text-gray-700"
                        }`}
                      >
                        {day.name}
                        {isToday && (
                          <span className="ml-1 text-accent font-semibold">●</span>
                        )}
                      </div>

                      <div className="p-2.5 flex-1 space-y-2">
                        {daySlots.length === 0 ? (
                          <div className="text-xs text-gray-400 text-center py-6 italic">
                            Off
                          </div>
                        ) : (
                          daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-2.5 rounded border border-gray-200 bg-white shadow-1 space-y-1.5"
                            >
                              <div className="flex justify-between items-start">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-primary-tint text-ink font-semibold border border-primary/30">
                                  {slot.subject}
                                </span>
                              </div>

                              <div className="text-xs font-mono font-semibold text-ink flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-gray-400" />
                                {slot.startTime} – {slot.endTime}
                              </div>

                              <div className="text-xs text-gray-600 flex items-center">
                                <School className="h-3 w-3 mr-1 text-gray-400" />
                                <span>
                                  {slot.batch.class.name}-{slot.batch.class.section}
                                </span>
                              </div>

                              {slot.room && (
                                <div className="text-xs text-gray-500 flex items-center">
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
