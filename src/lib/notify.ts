/**
 * AcademyHub - Notification Service
 * Provider-agnostic interface for SMS/WhatsApp notifications.
 *
 * NOTE (Pakistan SMS):
 * In development and by default, the LOG driver writes all notifications to console
 * and database logs. Real SMS/WhatsApp requires a paid Pakistani bulk gateway or
 * WhatsApp Business API configured via environment variables.
 * Never claim SMS "works" when only the log driver runs.
 */

export type NotificationChannel = "SMS" | "WHATSAPP";
export type NotificationStatus = "QUEUED" | "SENT" | "FAILED";

export interface NotificationPayload {
  recipientPhone: string;
  channel: NotificationChannel;
  template: string;
  message: string;
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
    console.log(
      `[NOTIFY LOG DRIVER] [${timestamp}] [${payload.channel}] To: ${payload.recipientPhone} | Template: ${payload.template}`
    );
    console.log(`[NOTIFY MESSAGE] ${payload.message}`);

    return {
      success: true,
      messageId: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
