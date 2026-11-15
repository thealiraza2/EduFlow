"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { generateNextAdmissionNumber } from "@/lib/admission";
import { EnrollmentStatus, Role, StudentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const admitStudentSchema = z.object({
  name: z.string().trim().min(2, "Student name must be at least 2 characters"),
  guardianName: z.string().trim().min(2, "Guardian name must be at least 2 characters"),
  guardianPhone: z.string().trim().min(10, "Please enter a valid phone number (e.g. 03001234567)"),
  dateOfBirth: z.string().optional().transform((val) => (val ? new Date(val) : undefined)),
  address: z.string().trim().optional(),
  batchId: z.string().optional(),
  createParentAccount: z.boolean().default(false),
  parentEmail: z.string().trim().email("Invalid email address").optional().or(z.literal("")),
  parentPassword: z.string().min(6, "Password must be at least 6 characters").optional().or(z.literal("")),
});

export type AdmitStudentInput = z.input<typeof admitStudentSchema>;

export async function admitStudentAction(data: AdmitStudentInput) {
  await requireAdmin();
  const tenant = await requireTenant();

  const validated = admitStudentSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(validated.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const {
    name,
    guardianName,
    guardianPhone,
    dateOfBirth,
    address,
    batchId,
    createParentAccount,
    parentEmail,
    parentPassword,
  } = validated.data;

  try {
    const newStudent = await db.$transaction(async (tx) => {
      let guardianUserId: string | null = null;

      // Handle optional Parent portal account creation
      if (createParentAccount && parentEmail && parentPassword) {
        const normalizedEmail = parentEmail.toLowerCase();

        // Check if user already exists
        let parentUser = await tx.user.findUnique({
          where: { email: normalizedEmail },
        });

        if (parentUser) {
          if (parentUser.role !== Role.PARENT) {
            throw new Error(`Email ${normalizedEmail} is already registered under role ${parentUser.role}`);
          }
          guardianUserId = parentUser.id;
        } else {
          const passwordHash = await bcrypt.hash(parentPassword, 10);
          parentUser = await tx.user.create({
            data: {
              academyId: tenant.academyId,
              email: normalizedEmail,
              passwordHash,
              name: guardianName,
              phone: guardianPhone,
              role: Role.PARENT,
            },
          });
          guardianUserId = parentUser.id;
        }
      }

      // Generate sequential, un-reused admission number scoped to this academy
      const admissionNo = await generateNextAdmissionNumber(tx, undefined, tenant.academyId);

      // Create student record
      const student = await tx.student.create({
        data: {
          academyId: tenant.academyId,
          admissionNo,
          name,
          guardianName,
          guardianPhone,
          guardianUserId,
          dateOfBirth,
          address,
          status: StudentStatus.ACTIVE,
        },
      });

      // If batchId is provided, enroll the student directly into the batch
      if (batchId) {
        const batch = await tx.batch.findFirst({
          where: { id: batchId, academyId: tenant.academyId },
        });

        if (batch) {
          await tx.enrollment.create({
            data: {
              academyId: tenant.academyId,
              studentId: student.id,
              batchId: batch.id,
              status: EnrollmentStatus.ACTIVE,
            },
          });
        }
      }

      return student;
    });

    revalidatePath("/admin/students");
    return {
      success: true,
      student: newStudent,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to admit student";
    return {
      success: false,
      error: message,
    };
  }
}

const updateStatusSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  status: z.nativeEnum(StudentStatus),
});

export async function updateStudentStatusAction(data: { studentId: string; status: StudentStatus }) {
  await requireAdmin();
  const tenant = await requireTenant();

  const validated = updateStatusSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Invalid status value provided" };
  }

  const { studentId, status } = validated.data;

  try {
    const updated = await db.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { id: studentId, academyId: tenant.academyId },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // If status changed to LEFT or STRUCK_OFF, mark their active enrollments as LEFT
      if (status === StudentStatus.LEFT || status === StudentStatus.STRUCK_OFF) {
        await tx.enrollment.updateMany({
          where: { studentId, academyId: tenant.academyId, status: EnrollmentStatus.ACTIVE },
          data: { status: EnrollmentStatus.LEFT },
        });
      }

      return await tx.student.update({
        where: { id: studentId },
        data: { status },
      });
    });

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    return { success: true, student: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update student status";
    return { success: false, error: message };
  }
}

const enrollSchema = z.object({
  studentId: z.string().min(1, "Student ID is required"),
  batchId: z.string().min(1, "Batch ID is required"),
});

export async function enrollStudentAction(data: { studentId: string; batchId: string }) {
  await requireAdmin();
  const tenant = await requireTenant();

  const validated = enrollSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Invalid enrollment details" };
  }

  const { studentId, batchId } = validated.data;

  try {
    const enrollment = await db.$transaction(async (tx) => {
      // 1. Verify student exists in this tenant and is active
      const student = await tx.student.findFirst({
        where: { id: studentId, academyId: tenant.academyId },
      });

      if (!student) {
        throw new Error("Student record does not exist.");
      }

      if (student.status !== StudentStatus.ACTIVE) {
        throw new Error(`Cannot enroll student: Status is currently ${student.status}. Only ACTIVE students can be enrolled.`);
      }

      // 2. Verify batch exists in this tenant
      const batch = await tx.batch.findFirst({
        where: { id: batchId, academyId: tenant.academyId },
        include: { class: true },
      });

      if (!batch) {
        throw new Error("Batch does not exist.");
      }

      // 3. Check for existing enrollment
      const existingEnrollment = await tx.enrollment.findFirst({
        where: {
          academyId: tenant.academyId,
          studentId,
          batchId,
        },
      });

      if (existingEnrollment) {
        if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
          throw new Error("Student is already actively enrolled in this batch.");
        } else {
          // Reactivate previously left enrollment
          return await tx.enrollment.update({
            where: { id: existingEnrollment.id },
            data: { status: EnrollmentStatus.ACTIVE, enrolledAt: new Date() },
          });
        }
      }

      // 4. Create new enrollment
      return await tx.enrollment.create({
        data: {
          academyId: tenant.academyId,
          studentId,
          batchId,
          status: EnrollmentStatus.ACTIVE,
        },
      });
    });

    revalidatePath("/admin/students");
    revalidatePath(`/admin/students/${studentId}`);
    revalidatePath("/admin/classes");
    return { success: true, enrollment };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to enroll student";
    return { success: false, error: message };
  }
}

export async function deleteStudentAction(studentId: string) {
  await requireAdmin();
  const tenant = await requireTenant();

  try {
    await db.$transaction(async (tx) => {
      const student = await tx.student.findFirst({
        where: { id: studentId, academyId: tenant.academyId },
      });

      if (!student) {
        throw new Error("Student record not found in this academy.");
      }

      // 1. Delete test attempts & student answers
      const attempts = await tx.testAttempt.findMany({
        where: { studentId },
        select: { id: true },
      });
      if (attempts.length > 0) {
        const attemptIds = attempts.map((a) => a.id);
        await tx.studentAnswer.deleteMany({
          where: { attemptId: { in: attemptIds } },
        });
        await tx.testAttempt.deleteMany({
          where: { studentId },
        });
      }

      // 2. Delete test results
      await tx.testResult.deleteMany({
        where: { studentId },
      });

      // 3. Delete fee payments & invoices
      const invoices = await tx.feeInvoice.findMany({
        where: { studentId },
        select: { id: true },
      });
      if (invoices.length > 0) {
        const invoiceIds = invoices.map((inv) => inv.id);
        await tx.feePayment.deleteMany({
          where: { invoiceId: { in: invoiceIds } },
        });
        await tx.feeInvoice.deleteMany({
          where: { studentId },
        });
      }

      // 4. Delete attendance & enrollments
      const enrollments = await tx.enrollment.findMany({
        where: { studentId },
        select: { id: true },
      });
      if (enrollments.length > 0) {
        const enrollmentIds = enrollments.map((e) => e.id);
        await tx.attendance.deleteMany({
          where: { enrollmentId: { in: enrollmentIds } },
        });
        await tx.enrollment.deleteMany({
          where: { studentId },
        });
      }

      // 5. Delete notifications
      await tx.notificationLog.deleteMany({
        where: { studentId },
      });

      // 6. Delete student record
      await tx.student.delete({
        where: { id: studentId },
      });

      // 7. If student had a direct user login account, delete it
      if (student.userId) {
        await tx.user.delete({
          where: { id: student.userId },
        });
      }
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/classes");
    revalidatePath("/admin/fees");
    revalidatePath("/admin/attendance");
    revalidatePath("/admin/results");

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete student";
    return { success: false, error: message };
  }
}
