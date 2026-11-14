/**
 * AcademyHub - CSV Reports Generation Module
 * Generates exportable CSV files for administrative oversight:
 * 1. Monthly fee collection report
 * 2. Attendance report per batch
 * 3. Student performance report
 * 4. Teacher workload report
 */

import { db } from "@/lib/db";
import { calculateRemainingBalance } from "@/lib/fees";
import { calculateGrade, calculatePercentage } from "@/lib/results";

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * 1. Monthly Fee Collection Report (CSV)
 */
export async function generateMonthlyFeeCollectionReportCsv(month: string): Promise<string> {
  const invoices = await db.feeInvoice.findMany({
    where: { month },
    include: {
      student: true,
      batch: { include: { class: true } },
      payments: true,
    },
    orderBy: [{ student: { admissionNo: "asc" } }],
  });

  const headers = [
    "Month",
    "Student Name",
    "Admission No",
    "Class",
    "Batch",
    "Tuition Fee (PKR)",
    "Late Fine (PKR)",
    "Discount (PKR)",
    "Total Payable (PKR)",
    "Paid Amount (PKR)",
    "Remaining Balance (PKR)",
    "Status",
    "Paid At",
  ];

  const rows = invoices.map((inv) => {
    const paidMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
    const remainingMinor = calculateRemainingBalance(inv.totalMinor, paidMinor);

    return [
      escapeCsv(inv.month),
      escapeCsv(inv.student.name),
      escapeCsv(inv.student.admissionNo),
      escapeCsv(inv.batch.class.name),
      escapeCsv(inv.batch.name),
      inv.amountMinor / 100,
      inv.fineMinor / 100,
      inv.discountMinor / 100,
      inv.totalMinor / 100,
      paidMinor / 100,
      remainingMinor / 100,
      escapeCsv(inv.status),
      escapeCsv(inv.paidAt ? inv.paidAt.toISOString().split("T")[0] : "—"),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * 2. Batch Attendance Report (CSV)
 */
export async function generateBatchAttendanceReportCsv(
  monthStr: string,
  batchId?: string
): Promise<string> {
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const enrollmentWhere: any = {
    status: "ACTIVE",
    student: { status: "ACTIVE" },
  };
  if (batchId) enrollmentWhere.batchId = batchId;

  const enrollments = await db.enrollment.findMany({
    where: enrollmentWhere,
    include: {
      student: true,
      batch: { include: { class: true } },
      attendance: {
        where: {
          date: { gte: startDate, lte: endDate },
        },
      },
    },
    orderBy: [{ batch: { name: "asc" } }, { student: { admissionNo: "asc" } }],
  });

  const headers = [
    "Month",
    "Class",
    "Batch",
    "Student Name",
    "Admission No",
    "Total Sessions",
    "Present",
    "Absent",
    "Leave",
    "Late",
    "Attendance %",
  ];

  const rows = enrollments.map((enr) => {
    const total = enr.attendance.length;
    const present = enr.attendance.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const absent = enr.attendance.filter((a) => a.status === "ABSENT").length;
    const leave = enr.attendance.filter((a) => a.status === "LEAVE").length;
    const late = enr.attendance.filter((a) => a.status === "LATE").length;
    const pct = total > 0 ? Math.round((present / total) * 1000) / 10 : 100;

    return [
      escapeCsv(monthStr),
      escapeCsv(enr.batch.class.name),
      escapeCsv(enr.batch.name),
      escapeCsv(enr.student.name),
      escapeCsv(enr.student.admissionNo),
      total,
      present,
      absent,
      leave,
      late,
      `${pct}%`,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * 3. Student Performance Report (CSV)
 */
export async function generateStudentPerformanceReportCsv(batchId?: string): Promise<string> {
  const where: any = {
    test: {
      status: "PUBLISHED",
    },
  };
  if (batchId) {
    where.test.batchId = batchId;
  }

  const results = await db.testResult.findMany({
    where,
    include: {
      student: true,
      test: {
        include: {
          batch: { include: { class: true } },
        },
      },
    },
    orderBy: [
      { test: { date: "desc" } },
      { student: { admissionNo: "asc" } },
    ],
  });

  const headers = [
    "Class",
    "Batch",
    "Student Name",
    "Admission No",
    "Test Title",
    "Subject",
    "Test Date",
    "Total Marks",
    "Obtained Marks",
    "Percentage",
    "Grade",
    "Faculty Remarks",
  ];

  const rows = results.map((r) => {
    const pct = calculatePercentage(r.obtainedMarks, r.test.totalMarks);
    const grade = calculateGrade(pct);

    return [
      escapeCsv(r.test.batch.class.name),
      escapeCsv(r.test.batch.name),
      escapeCsv(r.student.name),
      escapeCsv(r.student.admissionNo),
      escapeCsv(r.test.title),
      escapeCsv(r.test.subject),
      escapeCsv(r.test.date.toISOString().split("T")[0]),
      r.test.totalMarks,
      r.obtainedMarks,
      `${pct}%`,
      grade,
      escapeCsv(r.remarks || "—"),
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/**
 * 4. Teacher Workload Report (CSV)
 * Calculates weekly assigned lectures and hours from timetable slots.
 */
export async function generateTeacherWorkloadReportCsv(): Promise<string> {
  const teachers = await db.teacher.findMany({
    include: {
      user: true,
      batches: {
        include: { class: true },
      },
      timetableSlots: true,
    },
    orderBy: [{ user: { name: "asc" } }],
  });

  const headers = [
    "Teacher Name",
    "Email",
    "Phone",
    "Base Salary (PKR)",
    "Status",
    "Subjects",
    "Assigned Batches Count",
    "Assigned Batches List",
    "Weekly Lecture Slots",
    "Estimated Weekly Hours",
  ];

  const rows = teachers.map((t) => {
    // Calculate hours from slots e.g. "16:00" to "17:00"
    let totalMinutes = 0;
    t.timetableSlots.forEach((slot) => {
      const [startH, startM] = slot.startTime.split(":").map(Number);
      const [endH, endM] = slot.endTime.split(":").map(Number);
      const mins = (endH * 60 + endM) - (startH * 60 + startM);
      if (mins > 0) totalMinutes += mins;
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const batchList = t.batches.map((b) => `${b.class.name} ${b.name}`).join("; ");

    return [
      escapeCsv(t.user.name),
      escapeCsv(t.user.email),
      escapeCsv(t.user.phone || "—"),
      t.salaryMinor / 100,
      escapeCsv(t.status),
      escapeCsv(t.subjects.join(", ")),
      t.batches.length,
      escapeCsv(batchList || "None"),
      t.timetableSlots.length,
      totalHours,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}
