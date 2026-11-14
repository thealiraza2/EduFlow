import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdmitStudentModal } from "@/components/admin/AdmitStudentModal";
import { StudentList } from "@/components/admin/StudentList";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Students Directory</h1>
          <p className="text-slate-500">
            Admit students, manage student statuses, and oversee batch enrollments.
          </p>
        </div>
        <AdmitStudentModal />
      </div>

      <StudentList students={students} />
    </div>
  );
}
