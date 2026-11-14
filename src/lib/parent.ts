/**
 * AcademyHub - Parent Portal Service Layer
 * INVARIANT 5: Strict Parent & Child Data Isolation.
 * Every query filters by guardianUserId. Unauthorized access returns 403.
 */

import { db } from "@/lib/db";
import { assertParentOwnsStudent, AuthorizationError } from "@/lib/permissions";
import { calculatePositions, calculatePercentage, calculateGrade } from "@/lib/results";
import { calculateRemainingBalance } from "@/lib/fees";
import { Role } from "@prisma/client";

export interface ParentChildSummary {
  student: {
    id: string;
    name: string;
    admissionNo: string;
    status: string;
    guardianName: string;
    guardianPhone: string;
  };
  enrollments: Array<{
    id: string;
    batchId: string;
    batchName: string;
    className: string;
    timing: string;
    timetableSlots: Array<{
      id: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      subject: string;
      room: string | null;
      teacherName: string;
    }>;
  }>;
  attendance: {
    monthStr: string;
    totalSessions: number;
    presentCount: number;
    absentCount: number;
    leaveCount: number;
    lateCount: number;
    percentage: number;
    records: Array<{
      id: string;
      date: string;
      status: string;
      remarks: string | null;
      batchName: string;
    }>;
  };
  fees: {
    invoices: Array<{
      id: string;
      month: string;
      amountMinor: number;
      fineMinor: number;
      discountMinor: number;
      totalMinor: number;
      paidMinor: number;
      remainingMinor: number;
      status: string;
      paidAt: string | null;
      batchName: string;
      payments: Array<{
        id: string;
        amountMinor: number;
        method: string;
        paidAt: string;
        receivedBy: string;
      }>;
    }>;
    totalOutstandingMinor: number;
  };
  results: Array<{
    testId: string;
    title: string;
    subject: string;
    testDate: string;
    totalMarks: number;
    obtainedMarks: number;
    percentage: number;
    grade: string;
    classPosition: string;
    remarks: string | null;
  }>;
}

export interface ParentPortalData {
  parent: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  children: ParentChildSummary[];
  messages: Array<{
    id: string;
    channel: string;
    trigger: string;
    message: string;
    createdAt: string;
    status: string;
    studentName?: string;
  }>;
}

/**
 * Loads full dashboard data for a logged-in parent.
 * Scoped strictly by guardianUserId (Invariant 5).
 */
export async function getParentDashboardData(
  parentUserId: string,
  userRole: Role = Role.PARENT
): Promise<ParentPortalData> {
  const parentUser = await db.user.findUnique({
    where: { id: parentUserId },
  });

  if (!parentUser) {
    throw new AuthorizationError("Parent user account not found.", 404);
  }

  // Active or registered children linked via guardianUserId
  const childrenWhere = userRole === Role.ADMIN ? {} : { guardianUserId: parentUserId };
  const students = await db.student.findMany({
    where: childrenWhere,
    orderBy: { admissionNo: "asc" },
  });

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const startOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
  const endOfMonth = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999));

  const childrenSummaries: ParentChildSummary[] = [];

  for (const student of students) {
    // 1. Enrollments & Timetable
    const enrollments = await db.enrollment.findMany({
      where: {
        studentId: student.id,
        status: "ACTIVE",
      },
      include: {
        batch: {
          include: {
            class: true,
            timetableSlots: {
              include: {
                teacher: { include: { user: true } },
              },
              orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
            },
          },
        },
      },
    });

    const mappedEnrollments = enrollments.map((enr) => ({
      id: enr.id,
      batchId: enr.batch.id,
      batchName: `${enr.batch.class.name} ${enr.batch.name}`,
      className: enr.batch.class.name,
      timing: enr.batch.timing,
      timetableSlots: enr.batch.timetableSlots.map((slot) => ({
        id: slot.id,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        subject: slot.subject,
        room: slot.room,
        teacherName: slot.teacher.user.name,
      })),
    }));

    // 2. Attendance this month
    const enrollmentIds = enrollments.map((e) => e.id);
    const attendanceRecords = await db.attendance.findMany({
      where: {
        enrollmentId: { in: enrollmentIds },
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      include: {
        enrollment: {
          include: {
            batch: { include: { class: true } },
          },
        },
      },
      orderBy: { date: "desc" },
    });

    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
    const leaveCount = attendanceRecords.filter((a) => a.status === "LEAVE").length;
    const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
    const percentage = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 1000) / 10 : 100;

    const mappedAttendance = {
      monthStr: currentMonthStr,
      totalSessions,
      presentCount,
      absentCount,
      leaveCount,
      lateCount,
      percentage,
      records: attendanceRecords.map((a) => ({
        id: a.id,
        date: a.date.toISOString().split("T")[0],
        status: a.status,
        remarks: a.remarks,
        batchName: `${a.enrollment.batch.class.name} ${a.enrollment.batch.name}`,
      })),
    };

    // 3. Fees & Invoices
    const invoices = await db.feeInvoice.findMany({
      where: { studentId: student.id },
      include: {
        batch: { include: { class: true } },
        payments: { orderBy: { paidAt: "desc" } },
      },
      orderBy: { month: "desc" },
    });

    let totalOutstandingMinor = 0;
    const mappedInvoices = invoices.map((inv) => {
      const paidMinor = inv.payments.reduce((sum, p) => sum + p.amountMinor, 0);
      const remainingMinor = calculateRemainingBalance(inv.totalMinor, paidMinor);
      totalOutstandingMinor += remainingMinor;

      return {
        id: inv.id,
        month: inv.month,
        amountMinor: inv.amountMinor,
        fineMinor: inv.fineMinor,
        discountMinor: inv.discountMinor,
        totalMinor: inv.totalMinor,
        paidMinor,
        remainingMinor,
        status: inv.status,
        paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
        batchName: `${inv.batch.class.name} ${inv.batch.name}`,
        payments: inv.payments.map((p) => ({
          id: p.id,
          amountMinor: p.amountMinor,
          method: p.method,
          paidAt: p.paidAt.toISOString(),
          receivedBy: p.receivedBy,
        })),
      };
    });

    // 4. Published Results
    // Only published tests are visible to parents!
    const testResults = await db.testResult.findMany({
      where: {
        studentId: student.id,
        test: {
          status: "PUBLISHED",
        },
      },
      include: {
        test: {
          include: {
            results: true,
          },
        },
      },
      orderBy: { test: { date: "desc" } },
    });

    const mappedResults = testResults.map((tr) => {
      const allTestScores = tr.test.results.map((r) => ({
        id: r.id,
        obtainedMarks: r.obtainedMarks,
        studentId: r.studentId,
      }));

      const ranked = calculatePositions(allTestScores, tr.test.totalMarks);
      const myRank = ranked.find((r) => r.item.studentId === student.id);

      const pct = calculatePercentage(tr.obtainedMarks, tr.test.totalMarks);
      const grade = calculateGrade(pct);

      return {
        testId: tr.test.id,
        title: tr.test.title,
        subject: tr.test.subject,
        testDate: tr.test.date.toISOString().split("T")[0],
        totalMarks: tr.test.totalMarks,
        obtainedMarks: tr.obtainedMarks,
        percentage: pct,
        grade,
        classPosition: `${myRank?.positionFormatted || "—"} / ${tr.test.results.length}`,
        remarks: tr.remarks,
      };
    });

    childrenSummaries.push({
      student: {
        id: student.id,
        name: student.name,
        admissionNo: student.admissionNo,
        status: student.status,
        guardianName: student.guardianName,
        guardianPhone: student.guardianPhone,
      },
      enrollments: mappedEnrollments,
      attendance: mappedAttendance,
      fees: {
        invoices: mappedInvoices,
        totalOutstandingMinor,
      },
      results: mappedResults,
    });
  }

  // 5. Parent Notifications (Messages)
  const childrenIds = students.map((s) => s.id);
  const studentMap = new Map(students.map((s) => [s.id, s.name]));

  const notificationLogs = await db.notificationLog.findMany({
    where: {
      OR: [
        { studentId: { in: childrenIds } },
        ...(parentUser.phone ? [{ recipientPhone: parentUser.phone }] : []),
      ],
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const mappedMessages = notificationLogs.map((log) => ({
    id: log.id,
    channel: log.channel,
    trigger: log.trigger,
    message: log.message,
    createdAt: log.createdAt.toISOString(),
    status: log.status,
    studentName: log.studentId ? studentMap.get(log.studentId) : undefined,
  }));

  return {
    parent: {
      id: parentUser.id,
      name: parentUser.name,
      email: parentUser.email,
      phone: parentUser.phone,
    },
    children: childrenSummaries,
    messages: mappedMessages,
  };
}

/**
 * Loads data for a single child with strict ownership authorization (Invariant 5).
 * Direct URL guessing (/parent/child/[otherId]) throws 403 AuthorizationError!
 */
export async function getParentChildData(
  parentUserId: string,
  studentId: string,
  userRole: Role = Role.PARENT
): Promise<ParentChildSummary> {
  const student = await db.student.findUnique({
    where: { id: studentId },
  });

  if (!student) {
    throw new AuthorizationError("Student not found", 404);
  }

  // INVARIANT 5: Cross-child access is strictly blocked
  assertParentOwnsStudent(parentUserId, userRole, student.guardianUserId);

  const fullData = await getParentDashboardData(parentUserId, userRole);
  const child = fullData.children.find((c) => c.student.id === studentId);

  if (!child) {
    throw new AuthorizationError("Student data unavailable", 404);
  }

  return child;
}
