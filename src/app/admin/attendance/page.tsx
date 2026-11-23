import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdminAttendanceManager } from "@/components/admin/AdminAttendanceManager";
import { PageHeader } from "@/components/dashboard/kit";

export default async function AdminAttendancePage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const [batches, enrollments] = await Promise.all([
    db.batch.findMany({
      where: { academyId: tenant.academyId },
      include: {
        class: true,
      },
      orderBy: [
        { class: { name: "asc" } },
        { name: "asc" },
      ],
    }),
    db.enrollment.findMany({
      where: {
        academyId: tenant.academyId,
        status: "ACTIVE",
        student: { status: "ACTIVE" },
      },
      include: {
        student: true,
        batch: { include: { class: true } },
        attendance: {
          where: {
            date: { gte: startDate, lte: endDate },
          },
        },
      },
      orderBy: [
        { batch: { name: "asc" } },
        { student: { admissionNo: "asc" } },
      ],
    }),
  ]);

  const students = enrollments.map((enr) => {
    const totalSessions = enr.attendance.length;
    const presentCount = enr.attendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const absentCount = enr.attendance.filter((a) => a.status === "ABSENT").length;
    const leaveCount = enr.attendance.filter((a) => a.status === "LEAVE").length;
    const lateCount = enr.attendance.filter((a) => a.status === "LATE").length;
    const percentage =
      totalSessions > 0 ? Math.round((presentCount / totalSessions) * 1000) / 10 : null;
    const isAtRisk = totalSessions > 0 && percentage !== null && percentage < 75;

    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      admissionNo: enr.student.admissionNo,
      name: enr.student.name,
      guardianName: enr.student.guardianName,
      guardianPhone: enr.student.guardianPhone,
      batchName: `${enr.batch.class.name} ${enr.batch.name}`,
      batchId: enr.batch.id,
      totalSessions,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      percentage,
      isAtRisk,
    };
  });

  const atRiskStudents = students.filter((s) => s.isAtRisk);
  const initialMonthlyData = {
    students,
    atRiskStudents,
    totalStudents: students.length,
    atRiskCount: atRiskStudents.length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Daily register"
        title="Attendance"
        description="Monitor attendance, track students below the 75% mark and manage daily registers."
      />

      <AdminAttendanceManager
        batches={batches.map((b) => ({
          id: b.id,
          name: b.name,
          timing: b.timing,
          class: {
            name: b.class.name,
            section: b.class.section,
          },
        }))}
        initialMonthlyData={initialMonthlyData}
      />
    </div>
  );
}
