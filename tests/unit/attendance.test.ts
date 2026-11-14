import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  buildAbsenceMessage,
  sendAbsenceNotification,
  notifier,
} from "@/lib/notify";
import { AttendanceStatus } from "@prisma/client";

describe("Phase 4: Attendance & Parent Absence Notifications", () => {
  let testClassId: string;
  let testBatchId: string;
  let testStudentId: string;
  let testEnrollmentId: string;
  const testPhone = "03001234599";
  const testDateStr = "2026-11-14";
  const testDate = new Date(`${testDateStr}T00:00:00.000Z`);

  beforeAll(async () => {
    // Setup clean test fixture
    const cls = await db.class.create({
      data: {
        academyId: "seed-academy-id",
        name: "Test-9th",
        section: "Z",
        capacity: 30,
      },
    });
    testClassId = cls.id;

    const batch = await db.batch.create({
      data: {
        academyId: "seed-academy-id",
        classId: testClassId,
        name: "Test Morning Batch",
        timing: "8-10 AM",
        feeMinor: 400000,
      },
    });
    testBatchId = batch.id;

    const student = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `TEST-ATT-${Date.now()}`,
        name: "Zaid Khan",
        guardianName: "Tariq Khan",
        guardianPhone: testPhone,
      },
    });
    testStudentId = student.id;

    const enrollment = await db.enrollment.create({
      data: {
        academyId: "seed-academy-id",
        studentId: testStudentId,
        batchId: testBatchId,
      },
    });
    testEnrollmentId = enrollment.id;
  });

  afterAll(async () => {
    // Clean up test data
    if (testStudentId) {
      await db.notificationLog.deleteMany({ where: { studentId: testStudentId } });
      await db.attendance.deleteMany({ where: { enrollmentId: testEnrollmentId } });
      await db.enrollment.deleteMany({ where: { id: testEnrollmentId } });
      await db.student.deleteMany({ where: { id: testStudentId } });
    }
    if (testBatchId) {
      await db.batch.deleteMany({ where: { id: testBatchId } });
    }
    if (testClassId) {
      await db.class.deleteMany({ where: { id: testClassId } });
    }
  });

  it("formats the absence message in standard Pakistani academy format", () => {
    const msg = buildAbsenceMessage("Zaid Khan", "9th-Z Test Morning Batch");
    expect(msg).toBe(
      "Assalam-o-Alaikum, Zaid Khan aaj 9th-Z Test Morning Batch mein absent tha. — AcademyHub"
    );
  });

  it("upsert rule: marking twice for the same day updates the existing record, never duplicates", async () => {
    // First save: mark PRESENT
    const firstSave = await db.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: testEnrollmentId,
          date: testDate,
        },
      },
      create: {
        academyId: "seed-academy-id",
        enrollmentId: testEnrollmentId,
        date: testDate,
        status: AttendanceStatus.PRESENT,
        remarks: "Arrived on time",
      },
      update: {
        status: AttendanceStatus.PRESENT,
        remarks: "Arrived on time",
      },
    });

    expect(firstSave).toBeDefined();
    expect(firstSave.status).toBe("PRESENT");

    const countAfterFirst = await db.attendance.count({
      where: {
        enrollmentId: testEnrollmentId,
        date: testDate,
      },
    });
    expect(countAfterFirst).toBe(1);

    // Second save: mark ABSENT for the same day
    const secondSave = await db.attendance.upsert({
      where: {
        enrollmentId_date: {
          enrollmentId: testEnrollmentId,
          date: testDate,
        },
      },
      create: {
        academyId: "seed-academy-id",
        enrollmentId: testEnrollmentId,
        date: testDate,
        status: AttendanceStatus.ABSENT,
        remarks: "Changed to absent",
      },
      update: {
        status: AttendanceStatus.ABSENT,
        remarks: "Changed to absent",
      },
    });

    expect(secondSave.id).toBe(firstSave.id); // Same row updated!
    expect(secondSave.status).toBe("ABSENT");

    // Must still be exactly 1 row
    const countAfterSecond = await db.attendance.count({
      where: {
        enrollmentId: testEnrollmentId,
        date: testDate,
      },
    });
    expect(countAfterSecond).toBe(1);
  });

  it("duplicate-notification guard: saving twice creates only ONE NotificationLog row per absent student", async () => {
    // Clean any prior logs for this student
    await db.notificationLog.deleteMany({ where: { studentId: testStudentId } });

    // First save: triggers notification
    const res1 = await sendAbsenceNotification({
      studentId: testStudentId,
      studentName: "Zaid Khan",
      guardianPhone: testPhone,
      batchName: "Test Morning Batch",
      date: testDateStr,
    });

    expect(res1.sent).toBe(true);
    expect(res1.logId).toBeDefined();

    // Check NotificationLog table
    const logsAfterFirst = await db.notificationLog.findMany({
      where: {
        studentId: testStudentId,
        trigger: "ABSENCE",
      },
    });

    expect(logsAfterFirst.length).toBe(1);
    expect(logsAfterFirst[0].recipientPhone).toBe(testPhone);
    expect(logsAfterFirst[0].recipient).toBe(testPhone);
    expect(logsAfterFirst[0].message).toContain("Zaid Khan");
    expect(logsAfterFirst[0].message).toContain("Test Morning Batch");
    expect(logsAfterFirst[0].message).toContain("absent tha");

    // Second save: duplicate-notification guard must catch it
    const res2 = await sendAbsenceNotification({
      studentId: testStudentId,
      studentName: "Zaid Khan",
      guardianPhone: testPhone,
      batchName: "Test Morning Batch",
      date: testDateStr,
    });

    expect(res2.sent).toBe(false);
    expect(res2.reason).toBe("DUPLICATE_GUARD");
    expect(res2.logId).toBe(res1.logId);

    // NotificationLog must STILL have exactly 1 entry
    const logsAfterSecond = await db.notificationLog.findMany({
      where: {
        studentId: testStudentId,
        trigger: "ABSENCE",
      },
    });

    expect(logsAfterSecond.length).toBe(1);
    expect(logsAfterSecond[0].id).toBe(res1.logId);
  });

  it("manual verification check: mark 1 absent -> NotificationLog has exactly 1 entry with the right phone", async () => {
    const freshStudent = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `TEST-SINGLE-${Date.now()}`,
        name: "Bilal Ahmed",
        guardianName: "Ahmed Raza",
        guardianPhone: "03215554433",
      },
    });

    try {
      const res = await sendAbsenceNotification({
        studentId: freshStudent.id,
        studentName: freshStudent.name,
        guardianPhone: freshStudent.guardianPhone,
        batchName: "10th Science",
        date: "2026-11-14",
      });

      expect(res.sent).toBe(true);

      const logs = await db.notificationLog.findMany({
        where: { studentId: freshStudent.id },
      });

      expect(logs.length).toBe(1);
      expect(logs[0].recipientPhone).toBe("03215554433");
      expect(logs[0].recipient).toBe("03215554433");
      expect(logs[0].message).toBe(
        "Assalam-o-Alaikum, Bilal Ahmed aaj 10th Science mein absent tha. — AcademyHub"
      );
    } finally {
      await db.notificationLog.deleteMany({ where: { studentId: freshStudent.id } });
      await db.student.delete({ where: { id: freshStudent.id } });
    }
  });
});
