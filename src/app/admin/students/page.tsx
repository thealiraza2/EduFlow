import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdmitStudentModal } from "@/components/admin/AdmitStudentModal";
import { StudentList } from "@/components/admin/StudentList";
import { PageHeader } from "@/components/dashboard/kit";

export default async function StudentsPage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const students = await db.student.findMany({
    where: { academyId: tenant.academyId },
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: {
        include: {
          batch: {
            include: {
              class: true,
            },
          },
        },
      },
    },
  });

  const batches = await db.batch.findMany({
    where: { academyId: tenant.academyId },
    include: {
      class: true,
    },
    orderBy: [
      { class: { name: "asc" } },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="People"
        title="Students"
        description="Admit students, manage their status and oversee batch enrollments."
        actions={<AdmitStudentModal batches={batches} />}
      />

      <StudentList students={students} />
    </div>
  );
}
