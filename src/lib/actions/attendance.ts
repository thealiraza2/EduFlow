"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin, requireTeacher } from "@/lib/permissions";
import { sendAbsenceNotification } from "@/lib/notify";
import { AttendanceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

const attendanceRecordSchema = z.object({
  enrollmentId: z.string().min(1, "Enrollment ID is required"),
  status: z.enum(["PRESENT", "ABSENT", "LEAVE", "LATE"]),
  remarks: z.string().max(255).optional(),
});

const saveBatchAttendanceSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Expected YYYY-MM-DD"),
  records: z.array(attendanceRecordSchema).min(1, "At least one attendance record is required"),
});

export type SaveBatchAttendanceInput = z.infer<typeof saveBatchAttendanceSchema>;

/**
 * Calculates day difference between target date and today (local calendar days)
 */
function getDaysDifferenceFromToday(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number);
  const targetDate = new Date(year, month - 1, day);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const diffTime = today.getTime() - targetDate.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Saves or updates attendance for a batch on a given date.
 * - Enforces teacher batch isolation
 * - Enforces 7-day correction rule for teachers (older edits need admin)
 * - Upserts attendance rows (mark twice -> updates existing row, never duplicates)
 * - Queues absence notifications exactly once per student per day
 */
export async function saveBatchAttendanceAction(input: SaveBatchAttendanceInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in");
  }

  const validated = saveBatchAttendanceSchema.parse(input);
  const { batchId, date, records } = validated;

  // 1. Authorization & Role-based date validation
  const daysDiff = getDaysDifferenceFromToday(date);
  if (daysDiff < 0) {
    throw new Error("Cannot mark attendance for future dates.");
  }

  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: {
      class: true,
      teacher: true,
    },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only mark attendance for your own batches.");
    }

    // 7-day rule for teachers
    if (daysDiff > 7) {
      throw new Error(
        "Attendance for dates older than 7 days can only be updated by an administrator."
      );
    }
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden: Only teachers and administrators can mark attendance.");
  }

  // 2. Prepare Date object for PostgreSQL @db.Date
  // Using UTC midnight representation so PostgreSQL stores exact YYYY-MM-DD
  const targetDate = new Date(`${date}T00:00:00.000Z`);

  // 3. Upsert attendance records in a transaction
  await db.$transaction(async (tx) => {
    for (const record of records) {
      await tx.attendance.upsert({
        where: {
          enrollmentId_date: {
            enrollmentId: record.enrollmentId,
            date: targetDate,
          },
        },
        create: {
          enrollmentId: record.enrollmentId,
          date: targetDate,
          status: record.status as AttendanceStatus,
          remarks: record.remarks || null,
        },
        update: {
          status: record.status as AttendanceStatus,
          remarks: record.remarks || null,
        },
      });
    }
  });

  // 4. Send absence notifications for ABSENT students
  // Fetch active enrollment details with student and guardian info
  const absentRecords = records.filter((r) => r.status === "ABSENT");
  let notificationsSentCount = 0;

  if (absentRecords.length > 0) {
    const enrollments = await db.enrollment.findMany({
      where: {
        id: { in: absentRecords.map((r) => r.enrollmentId) },
        status: "ACTIVE",
      },
      include: {
        student: true,
      },
    });

    const studentMap = new Map(enrollments.map((e) => [e.id, e.student]));

    for (const rec of absentRecords) {
      const student = studentMap.get(rec.enrollmentId);
      if (student && student.guardianPhone) {
        const notifyResult = await sendAbsenceNotification({
          studentId: student.id,
          studentName: student.name,
          guardianPhone: student.guardianPhone,
          batchName: `${batch.class.name} ${batch.name}`,
          date,
        });

        if (notifyResult.sent) {
          notificationsSentCount++;
        }
      }
    }
  }

  revalidatePath("/teacher/attendance");
  revalidatePath("/admin/attendance");

  return {
    success: true,
    totalSaved: records.length,
    absentCount: absentRecords.length,
    notificationsSent: notificationsSentCount,
  };
}

/**
 * Loads batch roster and any existing attendance for the selected date
 */
export async function getBatchRosterWithAttendanceAction(batchId: string, dateStr: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const batch = await db.batch.findUnique({
    where: { id: batchId },
    include: {
      class: true,
      teacher: { include: { user: true } },
    },
  });

  if (!batch) {
    throw new Error("Batch not found");
  }

  // Teacher isolation check
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only view your own batches.");
    }
  }

  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  // Active students only: LEFT students disappear from attendance sheets
  const enrollments = await db.enrollment.findMany({
    where: {
      batchId,
      status: "ACTIVE",
      student: {
        status: "ACTIVE",
      },
    },
    include: {
      student: true,
      attendance: {
        where: {
          date: targetDate,
        },
      },
    },
    orderBy: {
      student: { admissionNo: "asc" },
    },
  });

  const roster = enrollments.map((enr) => {
    const att = enr.attendance[0] || null;
    return {
      enrollmentId: enr.id,
      studentId: enr.student.id,
      admissionNo: enr.student.admissionNo,
      name: enr.student.name,
      guardianName: enr.student.guardianName,
      guardianPhone: enr.student.guardianPhone,
      currentStatus: att ? att.status : null,
      remarks: att ? att.remarks || "" : "",
    };
  });

  const daysDiff = getDaysDifferenceFromToday(dateStr);
  const isLockedForTeacher = session.user.role === "TEACHER" && daysDiff > 7;

  return {
    batch,
    date: dateStr,
    roster,
    isLockedForTeacher,
    userRole: session.user.role,
  };
}

/**
 * Returns monthly attendance statistics per student and flags students below 75%
 */
export async function getMonthlyAttendanceStatsAction(params: {
  batchId?: string;
  monthStr: string; // YYYY-MM
}) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const { batchId, monthStr } = params;
  const [yearStr, monthNumStr] = monthStr.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  // Month range in UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  // Base filter for active enrollments
  const enrollmentWhere: Record<string, unknown> = {
    status: "ACTIVE",
    student: { status: "ACTIVE" },
  };

  if (batchId) {
    enrollmentWhere.batchId = batchId;
  }

  // Teacher can only see stats for their own batches
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    enrollmentWhere.batch = { teacherId: teacher.id };
  }

  const enrollments = await db.enrollment.findMany({
    where: enrollmentWhere,
    include: {
      student: true,
      batch: {
        include: { class: true },
      },
      attendance: {
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      },
    },
    orderBy: [
      { batch: { name: "asc" } },
      { student: { admissionNo: "asc" } },
    ],
  });

  const stats = enrollments.map((enr) => {
    const totalSessions = enr.attendance.length;
    const presentCount = enr.attendance.filter(
      (a) => a.status === "PRESENT" || a.status === "LATE"
    ).length;
    const absentCount = enr.attendance.filter((a) => a.status === "ABSENT").length;
    const leaveCount = enr.attendance.filter((a) => a.status === "LEAVE").length;
    const lateCount = enr.attendance.filter((a) => a.status === "LATE").length;

    const percentage = totalSessions > 0
      ? Math.round((presentCount / totalSessions) * 1000) / 10
      : 100; // If no sessions held yet, not marked at-risk

    const isAtRisk = totalSessions > 0 && percentage < 75;

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

  const atRiskStudents = stats.filter((s) => s.isAtRisk);

  return {
    monthStr,
    totalStudents: stats.length,
    atRiskCount: atRiskStudents.length,
    students: stats,
    atRiskStudents,
  };
}
