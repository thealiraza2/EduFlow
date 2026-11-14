/**
 * AcademyHub - Notification Service
 * Provider-agnostic interface for SMS/WhatsApp notifications.
 *
 * NOTE (Pakistan SMS):
 * In development and by default, the LOG driver writes all notifications to console
 * and database logs (NotificationLog). Real SMS/WhatsApp requires a paid Pakistani
 * bulk gateway or WhatsApp Business API configured via environment variables.
 * Never claim SMS "works" when only the log driver runs.
 */

import { db } from "@/lib/db";
import {
  NotificationChannel,
  NotificationStatus,
  NotificationTrigger,
} from "@prisma/client";

export type { NotificationChannel, NotificationStatus, NotificationTrigger };

export interface NotificationPayload {
  recipientPhone: string;
  channel?: NotificationChannel;
  template?: string;
  message: string;
  studentId?: string | null;
  trigger?: NotificationTrigger;
  referenceId?: string | null;
  status?: NotificationStatus;
  metadata?: Record<string, unknown>;
}

export interface NotificationResult {
  success: boolean;
  messageId?: string;
  error?: string;
  driver: "log" | "gateway";
}

export interface NotificationService {
  send(payload: NotificationPayload): Promise<NotificationResult>;
}

export class LogNotificationService implements NotificationService {
  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const timestamp = new Date().toISOString();
    const channel = payload.channel || "SMS";
    const template = payload.template || "GENERAL";
    const trigger = payload.trigger || "CUSTOM";
    const status = payload.status || "SENT";

    console.log(
      `[NOTIFY LOG DRIVER] [${timestamp}] [${channel}] To: ${payload.recipientPhone} | Template: ${template} | Trigger: ${trigger}`
    );
    console.log(`[NOTIFY MESSAGE] ${payload.message}`);

    // Persist to NotificationLog table in database
    const logRecord = await db.notificationLog.create({
      data: {
        channel,
        recipientPhone: payload.recipientPhone,
        recipient: payload.recipientPhone,
        template,
        message: payload.message,
        status,
        sentAt: status === "SENT" ? new Date() : null,
        studentId: payload.studentId || null,
        trigger,
        referenceId: payload.referenceId || null,
      },
    });

    return {
      success: true,
      messageId: logRecord.id,
      driver: "log",
    };
  }
}

// Singleton factory based on SMS_PROVIDER env
export function getNotificationService(): NotificationService {
  const provider = process.env.SMS_PROVIDER || "log";

  switch (provider.toLowerCase()) {
    case "log":
    default:
      return new LogNotificationService();
  }
}

export const notifier = getNotificationService();

/**
 * Builds the standard Pakistan academy absence message
 * "Assalam-o-Alaikum, [Student] aaj [Batch] mein absent tha. — AcademyHub"
 */
export function buildAbsenceMessage(studentName: string, batchName: string): string {
  return `Assalam-o-Alaikum, ${studentName} aaj ${batchName} mein absent tha. — AcademyHub`;
}

/**
 * Sends/queues absence notification with duplicate prevention
 * Exactly once per absence per day guard
 */
export async function sendAbsenceNotification({
  studentId,
  studentName,
  guardianPhone,
  batchName,
  date,
}: {
  studentId: string;
  studentName: string;
  guardianPhone: string;
  batchName: string;
  date: string; // YYYY-MM-DD
}): Promise<{ sent: boolean; logId?: string; reason?: string }> {
  const referenceId = `absence_${studentId}_${date}`;

  // Duplicate-notification guard: Check if already queued/sent for this student & date
  const existing = await db.notificationLog.findFirst({
    where: {
      studentId,
      trigger: "ABSENCE",
      referenceId,
    },
  });

  if (existing) {
    console.log(
      `[NOTIFY GUARD] Notification already sent for student ${studentName} (${studentId}) on date ${date}. Skipping duplicate.`
    );
    return { sent: false, logId: existing.id, reason: "DUPLICATE_GUARD" };
  }

  const message = buildAbsenceMessage(studentName, batchName);

  const result = await notifier.send({
    recipientPhone: guardianPhone,
    channel: "SMS",
    template: "ABSENCE_NOTIFICATION",
    trigger: "ABSENCE",
    studentId,
    referenceId,
    message,
  });

  return { sent: true, logId: result.messageId };
}
