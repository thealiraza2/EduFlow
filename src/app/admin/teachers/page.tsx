import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AddTeacherModal } from "@/components/admin/AddTeacherModal";
import { TeacherList } from "@/components/admin/TeacherList";
import { PageHeader } from "@/components/dashboard/kit";

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
      <PageHeader
        eyebrow="People"
        title="Teachers"
        description="Manage teacher accounts, subjects, salaries and assigned batches."
        actions={<AddTeacherModal />}
      />

      <TeacherList teachers={teachers} />
    </div>
  );
}
