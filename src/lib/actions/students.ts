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
