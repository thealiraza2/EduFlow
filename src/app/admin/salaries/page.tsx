import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { TeacherSalariesManager } from "@/components/admin/TeacherSalariesManager";
import { PageHeader } from "@/components/dashboard/kit";

export default async function AdminSalariesPage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const teachers = await db.teacher.findMany({
    where: { academyId: tenant.academyId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      batches: {
        include: {
          class: {
            select: { name: true },
          },
        },
      },
      timetableSlots: true,
      salaries: true,
    },
    orderBy: [{ user: { name: "asc" } }],
  });

  const serializedTeachers = teachers.map((t) => {
    let totalMinutes = 0;
    t.timetableSlots.forEach((slot) => {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const mins = endH * 60 + endM - (startH * 60 + startM);
      if (mins > 0) totalMinutes += mins;
    });
    const weeklyHours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      id: t.id,
      salaryMinor: t.salaryMinor,
      subjects: t.subjects,
      status: t.status,
      user: t.user,
      batches: t.batches.map((b) => ({
        id: b.id,
        name: b.name,
        class: { name: b.class.name },
      })),
      weeklyHours,
      salaries: t.salaries.map((s) => ({
        id: s.id,
        month: s.month,
        amountMinor: s.amountMinor,
        status: s.status as "PAID" | "UNPAID",
        paidAt: s.paidAt ? s.paidAt.toISOString() : null,
        notes: s.notes,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Payroll"
        description="Monthly teacher salaries, workload and payment tracking."
      />

      <TeacherSalariesManager
        teachers={serializedTeachers}
        initialMonth={currentMonth}
      />
    </div>
  );
}
