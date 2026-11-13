"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { rupeesToPaisa } from "@/lib/money";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createClassSchema = z.object({
  name: z.string().trim().min(1, "Class name is required (e.g. 9th, 10th, FSc-I)"),
  section: z.string().trim().min(1, "Section is required (e.g. A, Morning, Boys)"),
  capacity: z.number().int().positive("Capacity must be greater than zero").default(40),
});

export type CreateClassInput = z.infer<typeof createClassSchema>;

export async function createClassAction(data: CreateClassInput) {
  await requireAdmin();

  const validated = createClassSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(validated.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { name, section, capacity } = validated.data;

  try {
    const newClass = await db.class.create({
      data: {
        name,
        section,
        capacity,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true, class: newClass };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create class";
    return { success: false, error: message };
  }
}

const createBatchSchema = z.object({
  classId: z.string().min(1, "Class ID is required"),
  name: z.string().trim().min(2, "Batch name is required (e.g. Evening Batch)"),
  timing: z.string().trim().min(2, "Timing is required (e.g. 4-6 PM)"),
  teacherId: z.string().optional().or(z.literal("")).transform((val) => (val ? val : null)),
  feeRupees: z.number().int().nonnegative("Monthly fee must be a non-negative integer"),
});

export type CreateBatchInput = z.input<typeof createBatchSchema>;

export async function createBatchAction(data: CreateBatchInput) {
  await requireAdmin();

  const validated = createBatchSchema.safeParse(data);
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(validated.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { classId, name, timing, teacherId, feeRupees } = validated.data;

  try {
    const feeMinor = rupeesToPaisa(feeRupees);

    const result = await db.$transaction(async (tx) => {
      // 1. Verify class exists
      const classRecord = await tx.class.findUnique({
        where: { id: classId },
      });

      if (!classRecord) {
        throw new Error("Specified Class not found.");
      }

      // 2. If teacherId provided, verify teacher exists and is active
      if (teacherId) {
        const teacher = await tx.teacher.findUnique({
          where: { id: teacherId },
        });
        if (!teacher) {
          throw new Error("Specified Teacher not found.");
        }
      }

      // 3. Create batch
      const batch = await tx.batch.create({
        data: {
          classId,
          name,
          timing,
          teacherId,
          feeMinor,
        },
      });

      // 4. Create default fee plan for this batch
      await tx.feePlan.create({
        data: {
          batchId: batch.id,
          monthlyFeeMinor: feeMinor,
          admissionFeeMinor: 0,
          lateFineMinor: rupeesToPaisa(200), // Default PKR 200 late fine
          dueDayOfMonth: 10,
        },
      });

      return batch;
    });

    revalidatePath("/admin/classes");
    return { success: true, batch: result };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create batch";
    return { success: false, error: message };
  }
}

const assignTeacherSchema = z.object({
  batchId: z.string().min(1, "Batch ID is required"),
  teacherId: z.string().nullable(),
});

export async function assignBatchTeacherAction(data: { batchId: string; teacherId: string | null }) {
  await requireAdmin();

  const validated = assignTeacherSchema.safeParse(data);
  if (!validated.success) {
    return { success: false, error: "Invalid assignment details" };
  }

  const { batchId, teacherId } = validated.data;

  try {
    const updated = await db.batch.update({
      where: { id: batchId },
      data: { teacherId },
      include: {
        teacher: { include: { user: true } },
        class: true,
      },
    });

    revalidatePath("/admin/classes");
    return { success: true, batch: updated };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to assign teacher";
    return { success: false, error: message };
  }
}
