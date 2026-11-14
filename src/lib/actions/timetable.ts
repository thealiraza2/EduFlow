"use server";

import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSlotSchema = z
  .object({
    batchId: z.string().min(1, "Batch is required"),
    dayOfWeek: z.number().int().min(0).max(6, "Invalid day of week"),
    startTime: z.string().regex(timeRegex, "Start time must be HH:mm (e.g. 16:00)"),
    endTime: z.string().regex(timeRegex, "End time must be HH:mm (e.g. 17:00)"),
    subject: z.string().trim().min(1, "Subject is required (e.g. Maths)"),
    teacherId: z.string().min(1, "Teacher is required"),
    room: z.string().trim().optional().or(z.literal("")),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be strictly after start time",
    path: ["endTime"],
  });

export type CreateSlotInput = z.input<typeof createSlotSchema>;

export async function createTimetableSlotAction(input: CreateSlotInput) {
  await requireAdmin();
  const tenant = await requireTenant();

  const validated = createSlotSchema.safeParse(input);
  if (!validated.success) {
    return {
      success: false,
      error: "Validation failed: " + Object.values(validated.error.flatten().fieldErrors).flat().join(", "),
    };
  }

  const { batchId, dayOfWeek, startTime, endTime, subject, teacherId, room } = validated.data;

  try {
    const slot = await db.$transaction(async (tx) => {
      // 1. Verify batch exists in this tenant
      const batch = await tx.batch.findFirst({
        where: { id: batchId, academyId: tenant.academyId },
        include: { class: true },
      });

      if (!batch) {
        throw new Error("Batch not found.");
      }

      // 2. Verify teacher exists in this tenant
      const teacher = await tx.teacher.findFirst({
        where: { id: teacherId, academyId: tenant.academyId },
        include: { user: true },
      });

      if (!teacher) {
        throw new Error("Teacher not found.");
      }

      // 3. Invariant: Check for overlapping slot in the SAME batch on the SAME day
      const batchOverlap = await tx.timetableSlot.findFirst({
        where: {
          academyId: tenant.academyId,
          batchId,
          dayOfWeek,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
      });

      if (batchOverlap) {
        throw new Error(
          `Overlapping slot: This batch already has "${batchOverlap.subject}" scheduled from ${batchOverlap.startTime} to ${batchOverlap.endTime} on this day.`
        );
      }

      // 4. Invariant: Teacher cannot be booked in two batches at the same time
      const teacherConflict = await tx.timetableSlot.findFirst({
        where: {
          academyId: tenant.academyId,
          teacherId,
          dayOfWeek,
          startTime: { lt: endTime },
          endTime: { gt: startTime },
        },
        include: {
          batch: {
            include: { class: true },
          },
        },
      });

      if (teacherConflict) {
        throw new Error(
          `Double-booking conflict: Teacher ${teacher.user.name} is already booked in ${teacherConflict.batch.class.name} ${teacherConflict.batch.name} (${teacherConflict.startTime} – ${teacherConflict.endTime}) on this day.`
        );
      }

      // 5. Create timetable slot in this tenant
      return await tx.timetableSlot.create({
        data: {
          academyId: tenant.academyId,
          batchId,
          dayOfWeek,
          startTime,
          endTime,
          subject,
          teacherId,
          room: room || null,
        },
        include: {
          teacher: { include: { user: true } },
          batch: true,
        },
      });
    });

    revalidatePath("/admin/timetable");
    revalidatePath("/teacher");
    return { success: true, slot };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create timetable slot";
    return { success: false, error: message };
  }
}

export async function deleteTimetableSlotAction(slotId: string) {
  await requireAdmin();
  const tenant = await requireTenant();

  try {
    const slot = await db.timetableSlot.findFirst({
      where: { id: slotId, academyId: tenant.academyId },
    });
    if (!slot) {
      throw new Error("Timetable slot not found.");
    }

    await db.timetableSlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/admin/timetable");
    revalidatePath("/teacher");
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete slot";
    return { success: false, error: message };
  }
}
