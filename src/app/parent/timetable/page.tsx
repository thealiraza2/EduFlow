import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Clock, School, User } from "@/components/icons";
import { EmptyState, PageHeader, StatusPill } from "@/components/dashboard/kit";

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
    <div>
      <div className="space-y-6">
        <PageHeader
          eyebrow={`${children.length} ${children.length === 1 ? "child" : "children"} linked`}
          title="Timetable"
          description="Each child's weekly lectures, by batch."
        />

        {children.length === 0 ? (
          <EmptyState
            icon={User}
            title="No children linked yet"
            body="No student profiles are linked to your account. Please contact the school office."
          />
        ) : (
          <div className="space-y-8">
            {children.map((child) => (
              <div key={child.id} className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-serif text-[22px] font-bold tracking-[-0.02em] text-ink">{child.name}</h2>
                  <span className="rounded-md border border-line bg-surface px-1.5 py-0.5 font-mono text-[12px] text-ink-2">
                    {child.admissionNo}
                  </span>
                  <StatusPill tone={child.status === "ACTIVE" ? "success" : "neutral"}>
                    {child.status.charAt(0) + child.status.slice(1).toLowerCase()}
                  </StatusPill>
                </div>

                {child.enrollments.length === 0 ? (
                  <p className="text-sm text-slate-400 italic py-4">
                    {child.name} is not actively enrolled in any academic batches.
                  </p>
                ) : (
                  child.enrollments.map((enr) => (
                    <Card key={enr.id} className="overflow-hidden">
                      <CardHeader className="flex flex-col items-start justify-between gap-2 border-b border-line px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                        <div className="min-w-0">
                          <CardTitle className="flex items-center">
                            <School className="mr-2 h-4 w-4 shrink-0 text-primary" />
                            {enr.batch.class.name}-{enr.batch.class.section}, {enr.batch.name}
                          </CardTitle>
                          <CardDescription className="mt-0.5">Batch hours {enr.batch.timing}</CardDescription>
                        </div>
                        <StatusPill tone="plum">
                          {enr.batch.timetableSlots.length} lectures a week
                        </StatusPill>
                      </CardHeader>

                      <CardContent className="bg-canvas/60 p-3 sm:p-4">
                        {enr.batch.timetableSlots.length === 0 ? (
                          <div className="text-center py-6 text-xs text-slate-400 italic">
                            No lecture slots scheduled for this batch yet.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 [&>*]:min-w-0">
                            {displayDays.map((day) => {
                              const daySlots = enr.batch.timetableSlots.filter(
                                (s) => s.dayOfWeek === day.id
                              );

                              return (
                                <div
                                  key={day.id}
                                  className="flex min-h-[160px] flex-col overflow-hidden rounded-xl border border-line bg-surface"
                                >
                                  <div className="border-b border-line bg-surface-sunken py-2 text-center text-[13px] font-semibold text-ink-2">
                                    {day.short}
                                  </div>

                                  <div className="flex-1 space-y-2 p-2.5">
                                    {daySlots.length === 0 ? (
                                      <p className="py-6 text-center text-[13px] text-ink-3">Off</p>
                                    ) : (
                                      daySlots.map((slot) => (
                                        <div
                                          key={slot.id}
                                          className="space-y-1.5 rounded-lg border border-line bg-surface p-2.5 shadow-1"
                                        >
                                          <span className="inline-block max-w-full truncate rounded-md bg-primary-tint px-1.5 py-0.5 text-[12px] font-semibold text-primary">
                                            {slot.subject}
                                          </span>
                                          <p className="flex items-center font-mono text-[12px] font-medium text-ink">
                                            <Clock className="mr-1 h-3 w-3 shrink-0 text-ink-3" />
                                            {slot.startTime}–{slot.endTime}
                                          </p>
                                          <p className="truncate text-[12px] text-ink-3">{slot.teacher.user.name}</p>
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
