/**
 * AcademyHub - WhatsApp Business Bot Services (Phase 14)
 *
 * Implements parent inbound query processing:
 * - Parent identified strictly by guardian phone number (Isolation Invariant)
 * - Roman Urdu + English keyword routing:
 *   - "fee" / "fees" / "challan" -> child fee dues & status
 *   - "attendance" / "hazri" -> monthly attendance percentage
 *   - "result" / "results" -> latest published test results
 *   - "help" / "menu" -> interactive menu
 * - Unknown numbers get strict rejection message without leaking any system data.
 */

import crypto from "crypto";
import { db } from "@/lib/db";
import { formatPhoneForWhatsApp, notifier } from "@/lib/notify";
import { formatPKR } from "@/lib/money";
import { calculateRemainingBalance } from "@/lib/fees";
import { calculateGrade } from "@/lib/results";

/**
 * Validates Meta WhatsApp Webhook X-Hub-Signature-256
 */
export function verifyMetaSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): boolean {
  if (!signatureHeader || !appSecret) {
    return false;
  }

  const parts = signatureHeader.split("=");
  if (parts.length !== 2 || parts[0] !== "sha256") {
    return false;
  }

  const signature = parts[1];
  const expectedHash = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody, "utf8")
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedHash, "hex")
    );
  } catch {
    return false;
  }
}

export interface BotProcessInput {
  from: string; // Sender phone number
  text: string; // Inbound message text
  academyId?: string; // Optional tenant context
}

export interface BotProcessResult {
  matched: boolean;
  intent: "FEE" | "ATTENDANCE" | "RESULT" | "HELP" | "UNKNOWN_SENDER";
  studentCount: number;
  replyMessage: string;
  recipientPhone: string;
  logId?: string;
}

/**
 * Generates phone number variations for Pakistani mobile numbers
 * E.g. "923001234567" -> ["923001234567", "03001234567", "+923001234567"]
 */
export function getPhoneVariants(phone: string): string[] {
  const normalized = formatPhoneForWhatsApp(phone);
  const variants = new Set<string>();

  variants.add(normalized);
  if (normalized.startsWith("92")) {
    const local = "0" + normalized.slice(2);
    variants.add(local);
    variants.add("+" + normalized);
  } else if (normalized.startsWith("0")) {
    const intl = "92" + normalized.slice(1);
    variants.add(intl);
    variants.add("+" + intl);
  }

  // Also raw input
  variants.add(phone.trim());

  return Array.from(variants);
}

/**
 * Core Inbound WhatsApp Message Processor
 */
export async function processInboundWhatsAppMessage(
  input: BotProcessInput
): Promise<BotProcessResult> {
  const { from, text, academyId } = input;
  const rawQuery = (text || "").trim();
  const lowerQuery = rawQuery.toLowerCase();
  const phoneVariants = getPhoneVariants(from);

  // 1. Authenticate & Isolate: Look up students linked to this guardian phone
  const studentWhere: any = {
    OR: [
      { guardianPhone: { in: phoneVariants } },
      { guardianUser: { phone: { in: phoneVariants } } },
    ],
    status: "ACTIVE",
  };

  if (academyId) {
    studentWhere.academyId = academyId;
  }

  const students = await db.student.findMany({
    where: studentWhere,
    include: {
      academy: true,
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: { include: { class: true } },
          attendance: true,
        },
      },
      invoices: {
        include: { payments: true, batch: true },
        orderBy: { month: "desc" },
      },
      testResults: {
        where: { test: { status: "PUBLISHED" } },
        include: { test: true },
        orderBy: { test: { date: "desc" } },
      },
    },
  });

  // 2. Unknown Sender Guard (Isolation Invariant)
  if (students.length === 0) {
    const replyMessage =
      "Assalam-o-Alaikum! Aap ka phone number AcademyHub system mein kisi student ke sath register nahi hai. Barah-e-karam academy administration se rabta karein. — AcademyHub";

    const logRes = await notifier.send({
      recipientPhone: from,
      channel: "WHATSAPP",
      template: "WHATSAPP_BOT_UNREGISTERED",
      trigger: "CUSTOM",
      message: replyMessage,
    });

    return {
      matched: false,
      intent: "UNKNOWN_SENDER",
      studentCount: 0,
      replyMessage,
      recipientPhone: from,
      logId: logRes.messageId,
    };
  }

  const guardianName = students[0].guardianName || "Parent";
  let replyMessage = "";
  let intent: BotProcessResult["intent"] = "HELP";

  // 3. Keyword Routing (Roman Urdu + English)
  if (
    lowerQuery.includes("fee") ||
    lowerQuery.includes("fees") ||
    lowerQuery.includes("challan") ||
    lowerQuery.includes("due") ||
    lowerQuery.includes("dues") ||
    lowerQuery.includes("bill") ||
    lowerQuery.includes("paisa")
  ) {
    intent = "FEE";
    const parts: string[] = [`Assalam-o-Alaikum ${guardianName},\n*AcademyHub Fee Status Summary:*`];

    for (const s of students) {
      const unpaidInvoices = s.invoices.filter(
        (i) => i.status === "UNPAID" || i.status === "PARTIAL"
      );

      if (unpaidInvoices.length > 0) {
        parts.push(`\n👤 *${s.name}* (${s.admissionNo}):`);
        for (const inv of unpaidInvoices) {
          const paidMinor = inv.payments.reduce((sum, p) => sum + p.amountMinor, 0);
          const balanceMinor = calculateRemainingBalance(inv.totalMinor, paidMinor);
          parts.push(
            `• Month ${inv.month} (${inv.batch.name}): Due ${formatPKR(balanceMinor)} [Status: ${inv.status}]`
          );
        }
      } else {
        const lastInv = s.invoices[0];
        const lastMonth = lastInv ? lastInv.month : "Current";
        parts.push(
          `\n👤 *${s.name}* (${s.admissionNo}):\n• Masha'Allah, all fee dues are fully PAID! (Latest: ${lastMonth})`
        );
      }
    }

    parts.push("\nOnline payment ke liye student ya parent portal check karein.");
    parts.push("— AcademyHub");
    replyMessage = parts.join("\n");
  } else if (
    lowerQuery.includes("attendance") ||
    lowerQuery.includes("hazri") ||
    lowerQuery.includes("att") ||
    lowerQuery.includes("absent") ||
    lowerQuery.includes("present")
  ) {
    intent = "ATTENDANCE";
    const parts: string[] = [`Assalam-o-Alaikum ${guardianName},\n*AcademyHub Attendance Report:*`];

    for (const s of students) {
      const allAtt = s.enrollments.flatMap((e) => e.attendance);
      const totalSessions = allAtt.length;
      const presentCount = allAtt.filter(
        (a) => a.status === "PRESENT" || a.status === "LATE"
      ).length;
      const pct = totalSessions > 0 ? Math.round((presentCount / totalSessions) * 100) : 100;
      const statusIcon = pct >= 75 ? "✅ Satisfactory" : "⚠️ Needs Attention";

      parts.push(
        `\n👤 *${s.name}* (${s.admissionNo}):\n• Attendance: *${pct}%* (${presentCount}/${totalSessions} sessions)\n• Status: ${statusIcon}`
      );
    }

    parts.push("\nRozana hazri alerts SMS aur portal par bhi bhej di jati hain.");
    parts.push("— AcademyHub");
    replyMessage = parts.join("\n");
  } else if (
    lowerQuery.includes("result") ||
    lowerQuery.includes("results") ||
    lowerQuery.includes("marks") ||
    lowerQuery.includes("number") ||
    lowerQuery.includes("grade") ||
    lowerQuery.includes("test")
  ) {
    intent = "RESULT";
    const parts: string[] = [`Assalam-o-Alaikum ${guardianName},\n*AcademyHub Academic Results:*`];

    for (const s of students) {
      const latestResult = s.testResults[0];
      if (!latestResult) {
        parts.push(`\n👤 *${s.name}* (${s.admissionNo}):\n• Abhi koi published test result dastiyab nahi hai.`);
      } else {
        const test = latestResult.test;
        const pct =
          test.totalMarks > 0
            ? Math.round((latestResult.obtainedMarks / test.totalMarks) * 1000) / 10
            : 0;
        const grade = calculateGrade(pct);
        const dateStr = test.date.toISOString().split("T")[0];

        parts.push(
          `\n👤 *${s.name}* (${s.admissionNo}) - Latest Test:\n• Subject: *${test.subject}* (${test.title})\n• Marks: *${latestResult.obtainedMarks}/${test.totalMarks}* (${pct}%)\n• Grade: *${grade}*\n• Date: ${dateStr}`
        );
        if (latestResult.remarks) {
          parts.push(`• Teacher Remarks: "${latestResult.remarks}"`);
        }
      }
    }

    parts.push("\nMukammal result card PDF parent portal se download kar sakte hain.");
    parts.push("— AcademyHub");
    replyMessage = parts.join("\n");
  } else {
    // Default menu / help
    intent = "HELP";
    replyMessage = `Assalam-o-Alaikum ${guardianName}!
Welcome to AcademyHub WhatsApp Service.

Aap darj zail keywords likh kar bhej sakte hain:
1️⃣ *'fee'* — Fees dues aur payment status
2️⃣ *'attendance'* ya *'hazri'* — Hazri ki tafseelat aur percentage
3️⃣ *'result'* — Aakhri published test ke marks aur grade
4️⃣ *'help'* — Yeh menu dubara dekhne ke liye

(Aap Roman Urdu ya English mein message kar sakte hain)
— AcademyHub`;
  }

  // 4. Send Reply via Notification Service
  const logRes = await notifier.send({
    recipientPhone: from,
    channel: "WHATSAPP",
    template: `WHATSAPP_BOT_${intent}`,
    trigger: "CUSTOM",
    message: replyMessage,
    studentId: students[0].id,
    academyId: students[0].academyId,
  });

  return {
    matched: true,
    intent,
    studentCount: students.length,
    replyMessage,
    recipientPhone: from,
    logId: logRes.messageId,
  };
}
