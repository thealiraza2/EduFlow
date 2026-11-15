import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Calendar, Clock, MapPin, School, BookOpen, User, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ParentTimetablePage() {
  const user = await requireRole([Role.PARENT, Role.ADMIN]);

  // Master Prompt Invariant: Scoped strictly by guardianUserId
  const children = await db.student.findMany({
    where: user.role === Role.ADMIN ? {} : { guardianUserId: user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              class: true,
              timetableSlots: {
                include: {
                  teacher: {
                    include: { user: true },
                  },
                },
                orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
              },
            },
          },
        },
      },
    },
  });

  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-6 rounded-xl border shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link href="/parent">
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                Back to Dashboard
              </Link>
            </Button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Weekly Timetable</h1>
                <Badge variant="outline">Guardian Access</Badge>
              </div>
              <p className="text-slate-500 text-xs mt-1">
                Viewing schedule for <strong>{user.name}</strong> ({user.email})
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs px-3 py-1">
            {children.length} Registered {children.length === 1 ? "Child" : "Children"}
          </Badge>
        </div>

        {children.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-3">
              <User className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-lg font-semibold text-slate-900">No student records linked</h3>
              <p className="text-sm text-slate-500 max-w-sm mx-auto">
                No student profiles are currently linked to your guardian account. Please contact the academy administration.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {children.map((child) => (
              <div key={child.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b pb-2">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">{child.name}</h2>
                    <span className="text-xs font-mono text-slate-500">
                      Admission No: <strong>{child.admissionNo}</strong> | Status: {child.status}
                    </span>
                  </div>
                  <Badge variant={child.status === "ACTIVE" ? "default" : "secondary"}>
                    {child.status}
                  </Badge>
                </div>

                {child.enrollments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4">
                    {child.name} is not actively enrolled in any academic batches.
                  </p>
                ) : (
                  child.enrollments.map((enr) => (
                    <Card key={enr.id} className="shadow-sm overflow-hidden border">
                      <CardHeader className="bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 py-3 px-4 sm:px-5">
                        <div>
                          <CardTitle className="text-base sm:text-lg font-bold text-white flex items-center">
                            <School className="h-4 w-4 mr-2 text-blue-400 shrink-0" />
                            Class {enr.batch.class.name}-{enr.batch.class.section} — {enr.batch.name}
                          </CardTitle>
                          <CardDescription className="text-slate-300 text-xs">
                            Standard Batch Hours: {enr.batch.timing}
                          </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-white border-slate-700 text-xs shrink-0">
                          {enr.batch.timetableSlots.length} Weekly Lectures
                        </Badge>
                      </CardHeader>

                      <CardContent className="p-4 bg-slate-50/50">
                        {enr.batch.timetableSlots.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 italic">
                            No lecture slots scheduled for this batch yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                            {displayDays.map((day) => {
                              const daySlots = enr.batch.timetableSlots.filter(
                                (s) => s.dayOfWeek === day.id
                              );

                              return (
                                <div
                                  key={day.id}
                                  className="border rounded-md bg-white overflow-hidden shadow-2xs flex flex-col min-h-[160px]"
                                >
                                  <div className="bg-slate-100 font-semibold text-center text-xs py-1.5 text-slate-700 border-b">
                                    {day.short}
                                  </div>

                                  <div className="p-2 flex-1 space-y-1.5">
                                    {daySlots.length === 0 ? (
                                      <div className="text-[11px] text-slate-400 text-center py-4 italic">
                                        Off
                                      </div>
                                    ) : (
                                      daySlots.map((slot) => (
                                        <div
                                          key={slot.id}
                                          className="p-2 rounded bg-slate-50 border border-slate-200 text-xs space-y-1"
                                        >
                                          <div className="font-semibold text-slate-900 text-xs flex justify-between">
                                            <span>{slot.subject}</span>
                                          </div>
                                          <div className="text-[11px] font-mono text-slate-600 flex items-center">
                                            <Clock className="h-3 w-3 mr-1 text-slate-400" />
                                            {slot.startTime}–{slot.endTime}
                                          </div>
                                          <div className="text-[10px] text-slate-500 truncate">
                                            {slot.teacher.user.name}
                                          </div>
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
                  ))
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
