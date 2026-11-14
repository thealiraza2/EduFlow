"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin, requireTeacher } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { TestStatus } from "@prisma/client";

const createTestSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  subject: z.string().min(1, "Subject is required"),
  title: z.string().min(1, "Test title is required"),
  totalMarks: z.number().int().positive("Total marks must be a positive number"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (expected YYYY-MM-DD)"),
});

export type CreateTestInput = z.infer<typeof createTestSchema>;

/**
 * Creates a new test in DRAFT status
 */
export async function createTestAction(input: CreateTestInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validated = createTestSchema.parse(input);
  const { batchId, subject, title, totalMarks, date } = validated;

  const batch = await db.batch.findUnique({
    where: { id: batchId },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  // Teacher isolation: Teachers can only create tests for their own batches
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only create tests for your assigned batches.");
    }
  } else if (session.user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }

  const test = await db.test.create({
    data: {
      batchId,
      subject,
      title,
      totalMarks,
      date: new Date(`${date}T00:00:00.000Z`),
      status: TestStatus.DRAFT,
    },
  });

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/results");

  return {
    success: true,
    testId: test.id,
  };
}

const studentMarkEntrySchema = z.object({
  studentId: z.string().min(1),
  obtainedMarks: z.number().min(0, "Obtained marks cannot be negative"),
  remarks: z.string().max(255).optional(),
});

const submitMarksSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  results: z.array(studentMarkEntrySchema).min(1, "At least one student mark is required"),
  adminReason: z.string().optional(),
});

export type SubmitMarksInput = z.infer<typeof submitMarksSchema>;

/**
 * Submits or updates test marks for students.
 * INVARIANT 4: Marks are locked once published. Teacher edit attempts are rejected.
 */
export async function submitTestMarksAction(input: SubmitMarksInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validated = submitMarksSchema.parse(input);
  const { testId, results, adminReason } = validated;

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      batch: true,
      results: true,
    },
  });

  if (!test) {
    throw new Error("Test not found.");
  }

  // Lock Check (Invariant 4)
  if (test.status === TestStatus.PUBLISHED) {
    if (session.user.role === "TEACHER") {
      throw new Error(
        "Marks are locked because this test has already been published. Please contact an administrator to make corrections."
      );
    }

    // Admin must provide a reason for editing a published test
    if (!adminReason || adminReason.trim().length < 3) {
      throw new Error(
        "A correction reason is required when modifying marks for a published test."
      );
    }
  }

  // Teacher batch isolation check
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (test.batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only enter marks for your assigned batches.");
    }
  }

  // Validate 0 <= obtainedMarks <= totalMarks
  for (const r of results) {
    if (r.obtainedMarks > test.totalMarks) {
      throw new Error(
        `Obtained marks (${r.obtainedMarks}) cannot exceed total marks (${test.totalMarks}).`
      );
    }
  }

  const existingMap = new Map(test.results.map((r) => [r.studentId, r]));
  const timestamp = new Date().toISOString();

  await db.$transaction(async (tx) => {
    for (const r of results) {
      const existing = existingMap.get(r.studentId);

      let correctionLog = existing?.correctionLog || null;
      if (test.status === TestStatus.PUBLISHED && adminReason) {
        const oldMarks = existing ? existing.obtainedMarks : "None";
        const entry = `[${timestamp}] Admin (${session.user.name || "Admin"}): Changed marks from ${oldMarks} to ${r.obtainedMarks}. Reason: ${adminReason}`;
        correctionLog = correctionLog ? `${correctionLog} | ${entry}` : entry;
      }

      await tx.testResult.upsert({
        where: {
          testId_studentId: {
            testId,
            studentId: r.studentId,
          },
        },
        create: {
          testId,
          studentId: r.studentId,
          obtainedMarks: r.obtainedMarks,
          remarks: r.remarks || null,
          correctionLog,
        },
        update: {
          obtainedMarks: r.obtainedMarks,
          remarks: r.remarks || null,
          correctionLog,
        },
      });
    }
  });

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/results");

  return {
    success: true,
    count: results.length,
  };
}

/**
 * Publishes a DRAFT test, locking marks for teachers and stamping publishedAt.
 */
export async function publishTestAction(testId: string) {
  await requireAdmin();

  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      results: true,
    },
  });

  if (!test) {
    throw new Error("Test not found.");
  }

  if (test.results.length === 0) {
    throw new Error("Cannot publish a test with zero student marks.");
  }

  const updated = await db.test.update({
    where: { id: testId },
    data: {
      status: TestStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  revalidatePath("/admin/results");
  revalidatePath("/teacher/tests");

  return {
    success: true,
    publishedAt: updated.publishedAt,
  };
}

const correctStudentMarkSchema = z.object({
  testId: z.string().min(1),
  studentId: z.string().min(1),
  newObtainedMarks: z.number().min(0),
  reason: z.string().min(3, "Reason must be at least 3 characters"),
  remarks: z.string().optional(),
});

export type CorrectStudentMarkInput = z.infer<typeof correctStudentMarkSchema>;

/**
 * Admin action to correct a student's marks on a published test with an audit trail.
 */
export async function correctStudentMarkAction(input: CorrectStudentMarkInput) {
  const admin = await requireAdmin();

  const validated = correctStudentMarkSchema.parse(input);
  const { testId, studentId, newObtainedMarks, reason, remarks } = validated;

  const test = await db.test.findUnique({
    where: { id: testId },
  });

  if (!test) {
    throw new Error("Test not found");
  }

  if (newObtainedMarks > test.totalMarks) {
    throw new Error(`Marks cannot exceed test total marks (${test.totalMarks})`);
  }

  const existing = await db.testResult.findUnique({
    where: {
      testId_studentId: {
        testId,
        studentId,
      },
    },
  });

  if (!existing) {
    throw new Error("Student result record not found");
  }

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] Admin (${admin.name || "Admin"}): Marks changed from ${existing.obtainedMarks} to ${newObtainedMarks}. Reason: ${reason}`;
  const updatedCorrectionLog = existing.correctionLog
    ? `${existing.correctionLog} | ${logEntry}`
    : logEntry;

  await db.testResult.update({
    where: {
      testId_studentId: {
        testId,
        studentId,
      },
    },
    data: {
      obtainedMarks: newObtainedMarks,
      remarks: remarks !== undefined ? remarks : existing.remarks,
      correctionLog: updatedCorrectionLog,
    },
  });

  revalidatePath("/admin/results");
  revalidatePath("/teacher/tests");

  return {
    success: true,
    correctionLog: updatedCorrectionLog,
  };
}
