import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AddTeacherModal } from "@/components/admin/AddTeacherModal";
import { TeacherList } from "@/components/admin/TeacherList";

export default async function TeachersPage() {
  await requireAdmin();
  const tenant = await requireTenant();

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
          class: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Faculty & Teachers</h1>
          <p className="text-slate-500">
            Manage teacher user accounts, subjects, salaries, and assigned batches.
          </p>
        </div>
        <AddTeacherModal />
      </div>

      <TeacherList teachers={teachers} />
    </div>
  );
}
