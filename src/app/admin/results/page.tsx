import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdminResultsManager } from "@/components/admin/AdminResultsManager";
import { Award } from "lucide-react";

export default async function AdminResultsPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();

  const tests = await db.test.findMany({
    where: { academyId: tenant.academyId },
    include: {
      batch: {
        include: {
          class: true,
        },
      },
      results: {
        include: {
          student: true,
        },
        orderBy: {
          obtainedMarks: "desc",
        },
      },
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  const formattedTests = tests.map((t) => ({
    id: t.id,
    title: t.title,
    subject: t.subject,
    totalMarks: t.totalMarks,
    date: t.date.toISOString().split("T")[0],
    status: (t.results.length === 0 ? "DRAFT" : t.status) as "DRAFT" | "PUBLISHED",
    publishedAt: t.publishedAt ? t.publishedAt.toISOString() : null,
    batch: {
      id: t.batch.id,
      name: t.batch.name,
      class: {
        name: t.batch.class.name,
        section: t.batch.class.section,
      },
    },
    results: t.results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      obtainedMarks: r.obtainedMarks,
      remarks: r.remarks,
      correctionLog: r.correctionLog,
      student: {
        id: r.student.id,
        name: r.student.name,
        admissionNo: r.student.admissionNo,
        guardianPhone: r.student.guardianPhone,
      },
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <Award className="h-6 w-6 mr-2 text-blue-600" />
            Assessment Results & Publishing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Review draft faculty scores, officially publish results, and generate individual Result Card PDFs.
          </p>
        </div>
      </div>

      <AdminResultsManager
        initialTests={formattedTests}
        adminName={admin.name || "Administrator"}
      />
    </div>
  );
}
