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
      attempts: {
        include: {
          student: true,
        },
        orderBy: {
          score: "desc",
        },
      },
    },
    orderBy: [
      { date: "desc" },
      { createdAt: "desc" },
    ],
  });

  const formattedTests = tests.map((t) => {
    // Combine official results with any submitted/graded online test attempts not yet recorded as TestResult
    const combinedResults = t.results.map((r) => ({
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
    }));

    for (const att of t.attempts) {
      if (att.student && !combinedResults.some((r) => r.studentId === att.studentId)) {
        combinedResults.push({
          id: `attempt-${att.id}`,
          studentId: att.studentId,
          obtainedMarks: att.score,
          remarks: att.status === "GRADED" ? "Faculty Graded" : "Auto-graded (Draft Score)",
          correctionLog: null,
          student: {
            id: att.student.id,
            name: att.student.name,
            admissionNo: att.student.admissionNo,
            guardianPhone: att.student.guardianPhone,
          },
        });
      }
    }

    return {
      id: t.id,
      title: t.title,
      subject: t.subject,
      totalMarks: t.totalMarks,
      date: t.date.toISOString().split("T")[0],
      status: t.status as "DRAFT" | "PUBLISHED",
      publishedAt: t.publishedAt ? t.publishedAt.toISOString() : null,
      batch: {
        id: t.batch.id,
        name: t.batch.name,
        class: {
          name: t.batch.class.name,
          section: t.batch.class.section,
        },
      },
      results: combinedResults,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900 flex items-center">
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
