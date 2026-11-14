"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { notifier } from "@/lib/notify";
import { SalaryStatus, AnnouncementAudience, NotificationTrigger } from "@prisma/client";
import { revalidatePath } from "next/cache";

const markSalarySchema = z.object({
  teacherId: z.string().min(1, "Teacher ID is required"),
  month: z.string().regex(/^\d{4}-\d{2}$/, "Invalid month format. Expected YYYY-MM"),
  status: z.enum(["PAID", "UNPAID"]),
  notes: z.string().optional(),
});

export type MarkSalaryInput = z.infer<typeof markSalarySchema>;

/**
 * Marks teacher salary as PAID or UNPAID for a given month.
 * NOTE: This records salary status within AcademyHub. Actual bank transfer or cash
 * disbursement takes place outside the system.
 */
export async function markTeacherSalaryAction(input: MarkSalaryInput) {
  await requireAdmin();

  const validated = markSalarySchema.parse(input);
  const { teacherId, month, status, notes } = validated;

  const teacher = await db.teacher.findUnique({
    where: { id: teacherId },
  });

  if (!teacher) {
    throw new Error("Teacher not found");
  }

  const record = await db.teacherSalary.upsert({
    where: {
      teacherId_month: {
        teacherId,
        month,
      },
    },
    create: {
      teacherId,
      month,
      amountMinor: teacher.salaryMinor,
      status: status as SalaryStatus,
      paidAt: status === "PAID" ? new Date() : null,
      notes: notes || null,
    },
    update: {
      status: status as SalaryStatus,
      paidAt: status === "PAID" ? new Date() : null,
      notes: notes !== undefined ? notes : undefined,
    },
  });

  revalidatePath("/admin/salaries");
  revalidatePath("/admin");

  return {
    success: true,
    recordId: record.id,
    status: record.status,
    paidAt: record.paidAt,
  };
}

const createAnnouncementSchema = z.object({
  title: z.string().min(2, "Title is required"),
  content: z.string().min(5, "Content is required"),
  audience: z.enum(["ALL", "TEACHERS", "PARENTS"]),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;

/**
 * Creates an academy announcement and queues notifications via NotificationService (log driver).
 */
export async function createAnnouncementAction(input: CreateAnnouncementInput) {
  await requireAdmin();

  const validated = createAnnouncementSchema.parse(input);
  const { title, content, audience } = validated;

  const announcement = await db.announcement.create({
    data: {
      title,
      content,
      audience: audience as AnnouncementAudience,
    },
  });

  // Queue broadcast notification log
  await notifier.send({
    recipientPhone: "ACADEMY_BROADCAST",
    channel: "SMS",
    template: "ANNOUNCEMENT",
    trigger: NotificationTrigger.CUSTOM,
    referenceId: `announcement_${announcement.id}`,
    message: `[Announcement - ${title}] ${content} — AcademyHub`,
  });

  revalidatePath("/admin");
  revalidatePath("/teacher");
  revalidatePath("/parent");

  return {
    success: true,
    announcementId: announcement.id,
  };
}
