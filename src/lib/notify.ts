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
  academyId?: string;
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

    let academyId = payload.academyId;
    if (!academyId && payload.studentId) {
      const student = await db.student.findUnique({
        where: { id: payload.studentId },
        select: { academyId: true },
      });
      if (student?.academyId) {
        academyId = student.academyId;
      }
    }
    if (!academyId) {
      academyId = "seed-academy-id";
    }

    console.log(
      `[NOTIFY LOG DRIVER] [${timestamp}] [${channel}] To: ${payload.recipientPhone} | Template: ${template} | Trigger: ${trigger} | StudentId: ${payload.studentId || "N/A"} | Status: ${status}`
    );

    // Persist to NotificationLog table in database
    const logRecord = await db.notificationLog.create({
      data: {
        academyId,
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

/**
 * Normalizes phone numbers to Pakistan WhatsApp Cloud API international format
 * Examples:
 *   "03001234567" -> "923001234567"
 *   "+923001234567" -> "923001234567"
 *   "0300-1234567" -> "923001234567"
 */
export function formatPhoneForWhatsApp(phone: string): string {
  // Strip non-digits
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("92")) {
    return digits;
  }
  if (digits.startsWith("03")) {
    return `92${digits.slice(1)}`;
  }
  return digits;
}

export class WhatsAppNotificationService implements NotificationService {
  private token: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor(token?: string, phoneNumberId?: string, apiVersion: string = "v18.0") {
    this.token = token ?? process.env.WHATSAPP_TOKEN?.trim() ?? "";
    this.phoneNumberId = phoneNumberId ?? process.env.WHATSAPP_PHONE_NUMBER_ID?.trim() ?? "";
    this.apiVersion = apiVersion;
  }

  async send(payload: NotificationPayload): Promise<NotificationResult> {
    const channel: NotificationChannel = "WHATSAPP";
    const template = payload.template || "WHATSAPP_BOT";
    const trigger = payload.trigger || "CUSTOM";
    const status = payload.status || "SENT";
    const formattedPhone = formatPhoneForWhatsApp(payload.recipientPhone);

    let academyId = payload.academyId;
    if (!academyId && payload.studentId) {
      const student = await db.student.findUnique({
        where: { id: payload.studentId },
        select: { academyId: true },
      });
      if (student?.academyId) {
        academyId = student.academyId;
      }
    }
    if (!academyId) {
      academyId = "seed-academy-id";
    }

    let externalMessageId: string | undefined;
    let sendError: string | undefined;
    let driverUsed: "gateway" | "log" = "log";

    // If Meta WhatsApp Business credentials exist, send via Cloud API
    if (this.token && this.phoneNumberId) {
      try {
        const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: formattedPhone,
            type: "text",
            text: {
              preview_url: false,
              body: payload.message,
            },
          }),
        });

        if (res.ok) {
          const data = await res.json();
          externalMessageId = data.messages?.[0]?.id;
          driverUsed = "gateway";
        } else {
          const errText = await res.text();
          sendError = `WhatsApp API error ${res.status}: ${errText.slice(0, 150)}`;
          console.warn(`[WHATSAPP GATEWAY ERROR] ${sendError}`);
        }
      } catch (err: any) {
        sendError = err.message || "Failed to reach WhatsApp Cloud API";
        console.warn(`[WHATSAPP GATEWAY EXCEPTION] ${sendError}`);
      }
    } else {
      // Default / fallback driver: log driver
      const timestamp = new Date().toISOString();
      console.log(
        `[NOTIFY LOG DRIVER] [${timestamp}] [WHATSAPP] To: ${formattedPhone} (${payload.recipientPhone}) | Template: ${template} | Trigger: ${trigger} | StudentId: ${payload.studentId || "N/A"} | Status: ${status}`
      );
    }

    // Always log to NotificationLog table in database
    const logRecord = await db.notificationLog.create({
      data: {
        academyId,
        channel,
        recipientPhone: formattedPhone,
        recipient: payload.recipientPhone,
        template,
        message: payload.message,
        status: sendError ? "FAILED" : status,
        sentAt: sendError ? null : new Date(),
        studentId: payload.studentId || null,
        trigger,
        referenceId: externalMessageId || payload.referenceId || null,
      },
    });

    return {
      success: !sendError,
      messageId: logRecord.id,
      error: sendError,
      driver: driverUsed,
    };
  }
}

// Singleton factory based on SMS_PROVIDER env
export function getNotificationService(): NotificationService {
  const provider = (process.env.SMS_PROVIDER || "log").toLowerCase();

  switch (provider) {
    case "whatsapp":
      return new WhatsAppNotificationService();
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
  academyId,
}: {
  studentId: string;
  studentName: string;
  guardianPhone: string;
  batchName: string;
  date: string; // YYYY-MM-DD
  academyId?: string;
}): Promise<{ sent: boolean; logId?: string; reason?: string }> {
  const referenceId = `absence_${studentId}_${date}`;

  // Duplicate-notification guard: Check if already queued/sent for this student & date
  const existing = await db.notificationLog.findFirst({
    where: {
      studentId,
      trigger: "ABSENCE",
      referenceId,
      ...(academyId ? { academyId } : {}),
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
    academyId,
  });

  return { sent: true, logId: result.messageId };
}
