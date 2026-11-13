import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Clock, MapPin, School, Calendar, BookOpen } from "lucide-react";

export default async function TeacherDashboardPage() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  // Find the teacher profile
  let teacher = await db.teacher.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      batches: {
        include: { class: true },
      },
    },
  });

  // If viewing as admin without a direct teacher profile, fetch the first available teacher for demonstration
  if (!teacher && user.role === Role.ADMIN) {
    teacher = await db.teacher.findFirst({
      include: {
        user: true,
        batches: {
          include: { class: true },
        },
      },
    });
  }

  const slots = teacher
    ? await db.timetableSlot.findMany({
        where: { teacherId: teacher.id },
        include: {
          batch: {
            include: {
              class: true,
            },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      })
    : [];

  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-slate-900">Teacher Portal</h1>
              <Badge variant="secondary">{user.role}</Badge>
            </div>
            <p className="text-slate-500 text-sm mt-1">
              Logged in as <strong>{user.name}</strong> ({user.email})
              {teacher && ` • Subjects: ${teacher.subjects.join(", ")}`}
            </p>
          </div>
          {teacher && (
            <Badge variant="outline" className="text-xs px-3 py-1 font-mono">
              {teacher.batches.length} Assigned Batches
            </Badge>
          )}
        </div>

        {/* My Timetable This Week */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between py-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center text-white">
                <Calendar className="h-5 w-5 mr-2 text-blue-400" />
                My Timetable This Week
              </CardTitle>
              <CardDescription className="text-slate-300 text-xs">
                Weekly scheduled lectures and classroom assignments
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-white border-slate-700">
              {slots.length} Total Lectures
            </Badge>
          </CardHeader>

          <CardContent className="p-6">
            {!teacher ? (
              <p className="text-center text-slate-500 py-8">
                No active faculty profile linked to this user account.
              </p>
            ) : slots.length === 0 ? (
              <div className="text-center py-12 text-slate-400 italic">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                You do not have any lectures scheduled on your timetable this week.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {displayDays.map((day) => {
                  const daySlots = slots.filter((s) => s.dayOfWeek === day.id);

                  return (
                    <div
                      key={day.id}
                      className="border rounded-lg bg-white overflow-hidden shadow-xs flex flex-col min-h-[220px]"
                    >
                      <div className="bg-slate-100 font-semibold text-center text-xs py-2 text-slate-800 border-b">
                        {day.name}
                      </div>

                      <div className="p-2.5 flex-1 space-y-2 bg-slate-50/40">
                        {daySlots.length === 0 ? (
                          <div className="text-[11px] text-slate-400 text-center py-6 italic">
                            Off
                          </div>
                        ) : (
                          daySlots.map((slot) => (
                            <div
                              key={slot.id}
                              className="p-2.5 rounded border border-slate-200 bg-white shadow-xs space-y-1.5"
                            >
                              <div className="flex justify-between items-start">
                                <Badge variant="default" className="text-[10px] px-1.5 py-0 font-medium">
                                  {slot.subject}
                                </Badge>
                              </div>

                              <div className="text-xs font-mono font-semibold text-slate-900 flex items-center">
                                <Clock className="h-3 w-3 mr-1 text-slate-400" />
                                {slot.startTime} – {slot.endTime}
                              </div>

                              <div className="text-[11px] text-slate-600 flex items-center">
                                <School className="h-3 w-3 mr-1 text-slate-400" />
                                <span>
                                  {slot.batch.class.name}-{slot.batch.class.section}
                                </span>
                              </div>

                              {slot.room && (
                                <div className="text-[10px] text-slate-500 flex items-center">
                                  <MapPin className="h-3 w-3 mr-1 text-slate-400" />
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
