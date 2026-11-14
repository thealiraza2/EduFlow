"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { rupeesToPaisa } from "@/lib/money";
import { Role, TeacherStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createTeacherSchema = z.object({
  name: z.string().trim().min(2, "Teacher name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z.string().trim().min(10, "Please enter a valid contact phone"),
  subjects: z.string().min(1, "Please provide at least one subject (e.g. Maths, Physics)"),
  salaryRupees: z.number().int().nonnegative("Salary must be a non-negative integer"),
  joiningDate: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
});

export type CreateTeacherInput = z.input<typeof createTeacherSchema>;

export async function createTeacherAction(data: CreateTeacherInput) {
  await requireAdmin();
  const tenant = await requireTenant();

  const validated = createTeacherSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(validated.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { name, email, password, phone, subjects, salaryRupees, joiningDate } = validated.data;

  try {
    const subjectsArray = subjects
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Convert salary rupees to paisa (integer minor unit)
    const salaryMinor = rupeesToPaisa(salaryRupees);

    const result = await db.$transaction(async (tx) => {
      // 1. Verify email not already registered
      const existingUser = await tx.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new Error(`User with email "${email}" already exists.`);
      }

      // 2. Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // 3. Create User account with TEACHER role in this tenant
      const user = await tx.user.create({
        data: {
          academyId: tenant.academyId,
          email,
          passwordHash,
          name,
          phone,
          role: Role.TEACHER,
        },
      });

      // 4. Create Teacher record linked to user and tenant
      const teacher = await tx.teacher.create({
        data: {
          academyId: tenant.academyId,
          userId: user.id,
          subjects: subjectsArray,
          salaryMinor,
          joiningDate,
          status: TeacherStatus.ACTIVE,
        },
        include: {
          user: true,
        },
      });

      return teacher;
    });

    revalidatePath("/admin/teachers");
    revalidatePath("/admin/classes");
    return { success: true, teacher: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create teacher";
    return { success: false, error: message };
  }
}

export async function updateTeacherStatusAction(data: { teacherId: string; status: TeacherStatus }) {
  await requireAdmin();
  const tenant = await requireTenant();

  try {
    const teacher = await db.teacher.findFirst({
      where: { id: data.teacherId, academyId: tenant.academyId },
    });

    if (!teacher) {
      throw new Error("Teacher not found");
    }

    const updated = await db.teacher.update({
      where: { id: data.teacherId },
      data: { status: data.status },
    });

    revalidatePath("/admin/teachers");
    return { success: true, teacher: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to update teacher status";
    return { success: false, error: message };
  }
}
