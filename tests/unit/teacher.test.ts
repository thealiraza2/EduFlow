import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { Role, TestStatus } from "@prisma/client";
import { saveBatchAttendanceAction } from "@/lib/actions/attendance";
import { createTestAction, submitTestMarksAction } from "@/lib/actions/tests";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mutable mock session state
let mockCurrentUser: {
  id: string;
  name: string;
  email: string;
  role: Role;
  academyId?: string;
  academySlug?: string;
  academyStatus?: string;
} = {
  id: "teacherA-user",
  name: "Teacher A",
  email: "teacherA@test.local",
  role: Role.TEACHER,
  academyId: "seed-academy-id",
  academySlug: "main",
  academyStatus: "ACTIVE",
};

let mockCurrentTeacher: { id: string; userId: string } = {
  id: "teacherA-record",
  userId: "teacherA-user",
};

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockImplementation(async () => ({ user: mockCurrentUser })),
  requireRole: vi.fn().mockImplementation(async () => mockCurrentUser),
  requireUser: vi.fn().mockImplementation(async () => mockCurrentUser),
}));

vi.mock("@/lib/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/permissions")>();
  return {
    ...actual,
    requireAdmin: vi.fn().mockImplementation(async () => {
      if (mockCurrentUser.role !== Role.ADMIN) {
        const err = new actual.AuthorizationError("Forbidden: Admin access required", 403);
        throw err;
      }
      return mockCurrentUser;
    }),
    requireTeacher: vi.fn().mockImplementation(async () => {
      if (mockCurrentUser.role !== Role.TEACHER && mockCurrentUser.role !== Role.ADMIN) {
        const err = new actual.AuthorizationError("Forbidden: Teacher access required", 403);
        throw err;
      }
      return mockCurrentTeacher;
    }),
    requireParent: vi.fn(),
  };
});

describe("Phase 9 Unit Checkpoint: Teacher Isolation (Invariant 6)", () => {
  const ts = Date.now();

  let teacherAUserId: string;
  let teacherARecordId: string;
  let teacherBUserId: string;
  let teacherBRecordId: string;

  let testClassId: string;
  let batchAId: string;
  let batchBId: string;

  let studentAId: string;
  let studentBId: string;
  let enrollmentAId: string;
  let enrollmentBId: string;

  let testBId: string;

  beforeAll(async () => {
    // 1. Create Teacher A
    const userA = await db.user.create({
      data: {
        academyId: "seed-academy-id",
        email: `teacherA.${ts}@test.local`,
        passwordHash: "hash",
        name: "Teacher Alpha",
        role: Role.TEACHER,
      },
    });
    teacherAUserId = userA.id;

    const teacherA = await db.teacher.create({
      data: {
        academyId: "seed-academy-id",
        userId: teacherAUserId,
        salaryMinor: 5000000,
        subjects: ["Maths"],
      },
    });
    teacherARecordId = teacherA.id;

    // 2. Create Teacher B
    const userB = await db.user.create({
      data: {
        academyId: "seed-academy-id",
        email: `teacherB.${ts}@test.local`,
        passwordHash: "hash",
        name: "Teacher Beta",
        role: Role.TEACHER,
      },
    });
    teacherBUserId = userB.id;

    const teacherB = await db.teacher.create({
      data: {
        academyId: "seed-academy-id",
        userId: teacherBUserId,
        salaryMinor: 5500000,
        subjects: ["Biology"],
      },
    });
    teacherBRecordId = teacherB.id;

    // 3. Create Class and Batches
    const cls = await db.class.create({
      data: {
        academyId: "seed-academy-id",
        name: `Class-TeacherIso-${ts}`,
        section: "X",
        capacity: 35,
      },
    });
    testClassId = cls.id;

    const batchA = await db.batch.create({
      data: {
        academyId: "seed-academy-id",
        classId: testClassId,
        name: "Batch Alpha",
        timing: "08:00 - 10:00",
        feeMinor: 400000,
        teacherId: teacherARecordId,
      },
    });
    batchAId = batchA.id;

    const batchB = await db.batch.create({
      data: {
        academyId: "seed-academy-id",
        classId: testClassId,
        name: "Batch Beta",
        timing: "10:00 - 12:00",
        feeMinor: 450000,
        teacherId: teacherBRecordId,
      },
    });
    batchBId = batchB.id;

    // 4. Create Students and Enrollments
    const studentA = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `AH-ISO-A-${ts.toString().slice(-4)}`,
        name: "Student Alpha",
        guardianName: "Guardian Alpha",
        guardianPhone: "03001112233",
      },
    });
    studentAId = studentA.id;

    const enrA = await db.enrollment.create({
      data: {
        academyId: "seed-academy-id",
        studentId: studentAId,
        batchId: batchAId,
      },
    });
    enrollmentAId = enrA.id;

    const studentB = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `AH-ISO-B-${ts.toString().slice(-4)}`,
        name: "Student Beta",
        guardianName: "Guardian Beta",
        guardianPhone: "03004445566",
      },
    });
    studentBId = studentB.id;

    const enrB = await db.enrollment.create({
      data: {
        academyId: "seed-academy-id",
        studentId: studentBId,
        batchId: batchBId,
      },
    });
    enrollmentBId = enrB.id;

    // 5. Create Test for Batch B
    const testB = await db.test.create({
      data: {
        academyId: "seed-academy-id",
        batchId: batchBId,
        subject: "Biology",
        title: "Biology Quiz 1",
        totalMarks: 50,
        date: new Date(),
        status: TestStatus.DRAFT,
      },
    });
    testBId = testB.id;

    // Configure default test actor as Teacher A
    mockCurrentUser = {
      id: teacherAUserId,
      name: "Teacher Alpha",
      email: `teacherA.${ts}@test.local`,
      role: Role.TEACHER,
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    };
    mockCurrentTeacher = {
      id: teacherARecordId,
      userId: teacherAUserId,
    };
  });

  afterAll(async () => {
    // Cleanup
    if (testBId) {
      await db.testResult.deleteMany({ where: { testId: testBId } });
      await db.test.deleteMany({ where: { id: testBId } });
    }
    if (enrollmentAId) await db.enrollment.deleteMany({ where: { id: enrollmentAId } });
    if (enrollmentBId) await db.enrollment.deleteMany({ where: { id: enrollmentBId } });
    if (studentAId) await db.student.deleteMany({ where: { id: studentAId } });
    if (studentBId) await db.student.deleteMany({ where: { id: studentBId } });
    if (batchAId) await db.batch.deleteMany({ where: { id: batchAId } });
    if (batchBId) await db.batch.deleteMany({ where: { id: batchBId } });
    if (testClassId) await db.class.deleteMany({ where: { id: testClassId } });
    if (teacherARecordId) await db.teacher.deleteMany({ where: { id: teacherARecordId } });
    if (teacherBRecordId) await db.teacher.deleteMany({ where: { id: teacherBRecordId } });
    if (teacherAUserId) await db.user.deleteMany({ where: { id: teacherAUserId } });
    if (teacherBUserId) await db.user.deleteMany({ where: { id: teacherBUserId } });
  });

  it("blocks Teacher A from marking attendance for Teacher B's batch", async () => {
    // Teacher A tries to mark attendance for Batch B
    const todayStr = new Date().toISOString().split("T")[0];

    await expect(
      saveBatchAttendanceAction({
        batchId: batchBId,
        date: todayStr,
        records: [
          {
            enrollmentId: enrollmentBId,
            status: "PRESENT",
          },
        ],
      })
    ).rejects.toThrow(/Forbidden: You can only mark attendance for your own batches/i);
  });

  it("blocks Teacher A from creating tests for Teacher B's batch", async () => {
    const todayStr = new Date().toISOString().split("T")[0];

    await expect(
      createTestAction({
        batchId: batchBId,
        subject: "Maths",
        title: "Unauthorized Math Exam",
        totalMarks: 100,
        date: todayStr,
      })
    ).rejects.toThrow(/Forbidden: You can only create tests for your assigned batches/i);
  });

  it("blocks Teacher A from entering marks for Teacher B's test", async () => {
    await expect(
      submitTestMarksAction({
        testId: testBId,
        results: [
          {
            studentId: studentBId,
            obtainedMarks: 45,
          },
        ],
      })
    ).rejects.toThrow(/Forbidden: You can only enter marks for your assigned batches/i);
  });

  it("allows Teacher A to successfully mark attendance and create tests for their own batch", async () => {
    const todayStr = new Date().toISOString().split("T")[0];

    // Create test in Batch A
    const testA = await createTestAction({
      batchId: batchAId,
      subject: "Maths",
      title: "Algebra Quiz 1",
      totalMarks: 25,
      date: todayStr,
    });

    expect(testA.testId).toBeDefined();

    // Mark attendance in Batch A
    const attRes = await saveBatchAttendanceAction({
      batchId: batchAId,
      date: todayStr,
      records: [
        {
          enrollmentId: enrollmentAId,
          status: "PRESENT",
        },
      ],
    });

    expect(attRes.totalSaved).toBe(1);

    // Cleanup created test A and attendance
    await db.attendance.deleteMany({ where: { enrollmentId: enrollmentAId } });
    await db.test.delete({ where: { id: testA.testId } });
  });

  it("enforces Invariant 4 marks lock: teacher cannot edit marks on a PUBLISHED test", async () => {
    // Switch to Teacher B
    mockCurrentUser = {
      id: teacherBUserId,
      name: "Teacher Beta",
      email: `teacherB.${ts}@test.local`,
      role: Role.TEACHER,
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    };
    mockCurrentTeacher = {
      id: teacherBRecordId,
      userId: teacherBUserId,
    };

    // 1. Teacher B saves initial draft marks
    await submitTestMarksAction({
      testId: testBId,
      results: [{ studentId: studentBId, obtainedMarks: 38 }],
    });

    // 2. Publish test directly in DB (simulating admin publish)
    await db.test.update({
      where: { id: testBId },
      data: { status: TestStatus.PUBLISHED, publishedAt: new Date() },
    });

    // 3. Teacher B attempts to edit published marks -> must be rejected
    await expect(
      submitTestMarksAction({
        testId: testBId,
        results: [{ studentId: studentBId, obtainedMarks: 48 }],
      })
    ).rejects.toThrow(/Marks are locked because this test has already been published/i);
  });
});
