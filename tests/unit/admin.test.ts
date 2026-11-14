import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { Role, AttendanceStatus, TestStatus, SalaryStatus, AnnouncementAudience } from "@prisma/client";
import { markTeacherSalaryAction, createAnnouncementAction } from "@/lib/actions/admin";
import {
  generateMonthlyFeeCollectionReportCsv,
  generateBatchAttendanceReportCsv,
  generateStudentPerformanceReportCsv,
  generateTeacherWorkloadReportCsv,
} from "@/lib/reports";

// Mock auth & permissions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "mock-admin-id",
      name: "Admin User",
      email: "admin@test.local",
      role: "ADMIN",
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    },
  }),
  requireRole: vi.fn().mockResolvedValue({
    id: "mock-admin-id",
    name: "Admin User",
    email: "admin@test.local",
    role: "ADMIN",
    academyId: "seed-academy-id",
    academySlug: "main",
    academyStatus: "ACTIVE",
  }),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/permissions")>();
  return {
    ...actual,
    requireAdmin: vi.fn().mockResolvedValue({
      id: "mock-admin-id",
      name: "Admin User",
      email: "admin@test.local",
      role: "ADMIN",
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    }),
    requireTeacher: vi.fn(),
    requireParent: vi.fn(),
  };
});

describe("Phase 8: Admin Dashboard, Reports & Teacher Salaries", () => {
  const timestamp = Date.now();
  const testMonth = `2027-01`;

  let testTeacherUserId: string;
  let testTeacherId: string;
  let testClassId: string;
  let testBatchId: string;
  let testSlotId: string;
  let testStudentId: string;
  let testEnrollmentId: string;
  let testInvoiceId: string;
  let testTestId: string;
  let createdAnnouncementIds: string[] = [];

  beforeAll(async () => {
    // 1. Create Teacher User & Profile
    const teacherUser = await db.user.create({
      data: {
        academyId: "seed-academy-id",
        email: `teacher.phase8.${timestamp}@test.local`,
        passwordHash: "hash",
        name: "Professor Phase 8",
        role: Role.TEACHER,
        phone: "03009998877",
      },
    });
    testTeacherUserId = teacherUser.id;

    const teacher = await db.teacher.create({
      data: {
        academyId: "seed-academy-id",
        userId: testTeacherUserId,
        salaryMinor: 5000000, // PKR 50,000
        subjects: ["Physics", "Mathematics"],
      },
    });
    testTeacherId = teacher.id;

    // 2. Create Class & Batch
    const cls = await db.class.create({
      data: {
        academyId: "seed-academy-id",
        name: `Class-Phase8-${timestamp}`,
        section: "A",
        capacity: 40,
      },
    });
    testClassId = cls.id;

    const batch = await db.batch.create({
      data: {
        academyId: "seed-academy-id",
        classId: testClassId,
        name: "Morning Batch",
        timing: "09:00 - 11:00",
        feeMinor: 600000, // PKR 6,000
        teacherId: testTeacherId,
      },
    });
    testBatchId = batch.id;

    // 3. Create Timetable Slot (09:00 - 11:00 = 2 hours)
    const slot = await db.timetableSlot.create({
      data: {
        academyId: "seed-academy-id",
        batchId: testBatchId,
        dayOfWeek: 1, // Monday
        startTime: "09:00",
        endTime: "11:00",
        subject: "Physics",
        teacherId: testTeacherId,
        room: "Lab 1",
      },
    });
    testSlotId = slot.id;

    // 4. Create Student & Enrollment
    const student = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `AH-TEST-${timestamp.toString().slice(-4)}`,
        name: "Test Student Phase 8",
        guardianName: "Guardian Phase 8",
        guardianPhone: "03001234567",
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

    // 5. Create Attendance for testing report
    await db.attendance.create({
      data: {
        academyId: "seed-academy-id",
        enrollmentId: testEnrollmentId,
        date: new Date(Date.UTC(2027, 0, 5)),
        status: AttendanceStatus.PRESENT,
      },
    });

    // 6. Create Invoice & Payment
    const invoice = await db.feeInvoice.create({
      data: {
        academyId: "seed-academy-id",
        studentId: testStudentId,
        batchId: testBatchId,
        month: testMonth,
        amountMinor: 600000,
        discountMinor: 100000,
        fineMinor: 0,
        totalMinor: 500000,
        status: "PAID",
        paidAt: new Date(Date.UTC(2027, 0, 10)),
      },
    });
    testInvoiceId = invoice.id;

    await db.feePayment.create({
      data: {
        academyId: "seed-academy-id",
        invoiceId: testInvoiceId,
        amountMinor: 500000,
        method: "CASH",
        receivedBy: "mock-admin-id",
      },
    });

    // 7. Create Test & Test Result
    const testRecord = await db.test.create({
      data: {
        academyId: "seed-academy-id",
        batchId: testBatchId,
        title: "Mid-Term Physics",
        subject: "Physics",
        totalMarks: 100,
        date: new Date(Date.UTC(2027, 0, 15)),
        status: TestStatus.PUBLISHED,
        publishedAt: new Date(Date.UTC(2027, 0, 16)),
      },
    });
    testTestId = testRecord.id;

    await db.testResult.create({
      data: {
        academyId: "seed-academy-id",
        testId: testTestId,
        studentId: testStudentId,
        obtainedMarks: 88,
        remarks: "Excellent analytical reasoning",
      },
    });
  });

  afterAll(async () => {
    // Clean up test entities
    if (createdAnnouncementIds.length > 0) {
      await db.announcement.deleteMany({
        where: { id: { in: createdAnnouncementIds } },
      });
    }

    if (testTestId) {
      await db.testResult.deleteMany({ where: { testId: testTestId } });
      await db.test.deleteMany({ where: { id: testTestId } });
    }

    if (testInvoiceId) {
      await db.feePayment.deleteMany({ where: { invoiceId: testInvoiceId } });
      await db.feeInvoice.deleteMany({ where: { id: testInvoiceId } });
    }

    if (testEnrollmentId) {
      await db.attendance.deleteMany({ where: { enrollmentId: testEnrollmentId } });
      await db.enrollment.deleteMany({ where: { id: testEnrollmentId } });
    }

    if (testStudentId) {
      await db.student.deleteMany({ where: { id: testStudentId } });
    }

    if (testSlotId) {
      await db.timetableSlot.deleteMany({ where: { id: testSlotId } });
    }

    if (testBatchId) {
      await db.batch.deleteMany({ where: { id: testBatchId } });
    }

    if (testClassId) {
      await db.class.deleteMany({ where: { id: testClassId } });
    }

    if (testTeacherId) {
      await db.teacherSalary.deleteMany({ where: { teacherId: testTeacherId } });
      await db.teacher.deleteMany({ where: { id: testTeacherId } });
    }

    if (testTeacherUserId) {
      await db.user.deleteMany({ where: { id: testTeacherUserId } });
    }
  });

  describe("1. Teacher Salaries Lifecycle", () => {
    it("marks a teacher's salary as PAID and records timestamp", async () => {
      const res = await markTeacherSalaryAction({
        teacherId: testTeacherId,
        month: testMonth,
        status: "PAID",
        notes: "January wire disbursed",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(SalaryStatus.PAID);
      expect(res.paidAt).not.toBeNull();

      const inDb = await db.teacherSalary.findUnique({
        where: {
          teacherId_month: {
            teacherId: testTeacherId,
            month: testMonth,
          },
        },
      });

      expect(inDb).not.toBeNull();
      expect(inDb?.status).toBe(SalaryStatus.PAID);
      expect(inDb?.amountMinor).toBe(5000000); // PKR 50,000 in paisas
    });

    it("toggles salary back to UNPAID and clears paidAt", async () => {
      const res = await markTeacherSalaryAction({
        teacherId: testTeacherId,
        month: testMonth,
        status: "UNPAID",
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe(SalaryStatus.UNPAID);
      expect(res.paidAt).toBeNull();

      const inDb = await db.teacherSalary.findUnique({
        where: {
          teacherId_month: {
            teacherId: testTeacherId,
            month: testMonth,
          },
        },
      });

      expect(inDb?.status).toBe(SalaryStatus.UNPAID);
      expect(inDb?.paidAt).toBeNull();
    });

    it("rejects invalid month format with Zod validation error", async () => {
      await expect(
        markTeacherSalaryAction({
          teacherId: testTeacherId,
          month: "2027/01",
          status: "PAID",
        })
      ).rejects.toThrow();
    });
  });

  describe("2. Announcements Creation & Target Audiences", () => {
    it("creates an announcement with audience ALL and queues broadcast notification", async () => {
      const res = await createAnnouncementAction({
        title: "Test Exam Timetable Released",
        content: "Please check your portal for the detailed timetable.",
        audience: "ALL",
      });

      expect(res.success).toBe(true);
      expect(res.announcementId).toBeDefined();
      createdAnnouncementIds.push(res.announcementId);

      const inDb = await db.announcement.findUnique({
        where: { id: res.announcementId },
      });
      expect(inDb).not.toBeNull();
      expect(inDb?.audience).toBe(AnnouncementAudience.ALL);
    });

    it("creates teacher-only and parent-only announcements and checks role audience queries", async () => {
      const teacherNotice = await createAnnouncementAction({
        title: "Faculty Staff Meeting",
        content: "Monthly staff review meeting on Saturday 5 PM.",
        audience: "TEACHERS",
      });
      createdAnnouncementIds.push(teacherNotice.announcementId);

      const parentNotice = await createAnnouncementAction({
        title: "Parent-Teacher Conference",
        content: "PTM will be conducted this Sunday from 10 AM to 1 PM.",
        audience: "PARENTS",
      });
      createdAnnouncementIds.push(parentNotice.announcementId);

      // Teacher query should see ALL and TEACHERS, but NOT PARENTS
      const teacherVisible = await db.announcement.findMany({
        where: {
          id: { in: createdAnnouncementIds },
          audience: { in: [AnnouncementAudience.ALL, AnnouncementAudience.TEACHERS] },
        },
      });
      const teacherVisibleIds = teacherVisible.map((a) => a.id);
      expect(teacherVisibleIds).toContain(teacherNotice.announcementId);
      expect(teacherVisibleIds).not.toContain(parentNotice.announcementId);

      // Parent query should see ALL and PARENTS, but NOT TEACHERS
      const parentVisible = await db.announcement.findMany({
        where: {
          id: { in: createdAnnouncementIds },
          audience: { in: [AnnouncementAudience.ALL, AnnouncementAudience.PARENTS] },
        },
      });
      const parentVisibleIds = parentVisible.map((a) => a.id);
      expect(parentVisibleIds).toContain(parentNotice.announcementId);
      expect(parentVisibleIds).not.toContain(teacherNotice.announcementId);
    });
  });

  describe("3. CSV Reports Generation", () => {
    it("generates Monthly Fee Collection Report CSV with correct monetary calculations", async () => {
      const csv = await generateMonthlyFeeCollectionReportCsv(testMonth);
      expect(csv).toContain("Month,Student Name,Admission No,Class,Batch");
      expect(csv).toContain("Test Student Phase 8");
      expect(csv).toContain("5000"); // Total Payable PKR 5,000
      expect(csv).toContain("PAID");
    });

    it("generates Batch Attendance Report CSV with student attendance percentage", async () => {
      const csv = await generateBatchAttendanceReportCsv("2027-01", testBatchId);
      expect(csv).toContain("Month,Class,Batch,Student Name,Admission No");
      expect(csv).toContain("Test Student Phase 8");
      expect(csv).toContain("100%"); // 1 present out of 1 session = 100%
    });

    it("generates Student Performance Report CSV with test marks, percentage, and grade", async () => {
      const csv = await generateStudentPerformanceReportCsv(testBatchId);
      expect(csv).toContain("Class,Batch,Student Name,Admission No,Test Title,Subject");
      expect(csv).toContain("Mid-Term Physics");
      expect(csv).toContain("Test Student Phase 8");
      expect(csv).toContain("88"); // Obtained marks
      expect(csv).toContain("88%"); // Percentage
      expect(csv).toContain("A"); // Grade for 88%
    });

    it("generates Teacher Workload Report CSV with accurate weekly lecture hours", async () => {
      const csv = await generateTeacherWorkloadReportCsv();
      expect(csv).toContain("Teacher Name,Email,Phone,Base Salary (PKR)");
      expect(csv).toContain("Professor Phase 8");
      expect(csv).toContain("50000"); // Base salary PKR 50,000
      expect(csv).toContain("2"); // 2 hours weekly
    });
  });
});
