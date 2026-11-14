import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { db } from "@/lib/db";
import { processInboundWhatsAppMessage, getPhoneVariants, verifyMetaSignature } from "@/lib/whatsapp-bot";
import {
  createQRToken,
  verifyQRToken,
  markAttendanceViaQR,
} from "@/lib/qr";
import { AttendanceStatus, TestStatus } from "@prisma/client";

process.env.QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || "test_qr_hmac_secret_key_1234567890abcdef";

describe("Phase 14: WhatsApp Inbound Webhook & Signature Verification", () => {
  const secret = "test_meta_app_secret_12345";
  const body = JSON.stringify({
    object: "whatsapp_business_account",
    entry: [{ id: "123", changes: [] }],
  });

  it("accepts valid X-Hub-Signature-256 HMAC-SHA256 signature", () => {
    const validHash = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const validHeader = `sha256=${validHash}`;

    expect(verifyMetaSignature(body, validHeader, secret)).toBe(true);
  });

  it("rejects tampered or forged signature", () => {
    const forgedHeader = "sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    expect(verifyMetaSignature(body, forgedHeader, secret)).toBe(false);

    // Tampered payload
    const validHash = crypto.createHmac("sha256", secret).update(body).digest("hex");
    const tamperedBody = body + " ";
    expect(verifyMetaSignature(tamperedBody, `sha256=${validHash}`, secret)).toBe(false);
  });

  it("rejects when signature header or app secret is missing", () => {
    expect(verifyMetaSignature(body, null, secret)).toBe(false);
    expect(verifyMetaSignature(body, "", secret)).toBe(false);
    expect(verifyMetaSignature(body, "sha256=123", "")).toBe(false);
  });
});

describe("Phase 14: WhatsApp Bot Inbound Keyword Routing & Parent Isolation", () => {
  it("generates phone variants for Pakistani mobile numbers", () => {
    const variants = getPhoneVariants("03001234567");
    expect(variants).toContain("923001234567");
    expect(variants).toContain("03001234567");
    expect(variants).toContain("+923001234567");
  });

  it("unknown sender phone number receives strict isolation rejection without leaking system data", async () => {
    const result = await processInboundWhatsAppMessage({
      from: "923999999999", // Unregistered number
      text: "fee",
    });

    expect(result.matched).toBe(false);
    expect(result.intent).toBe("UNKNOWN_SENDER");
    expect(result.studentCount).toBe(0);
    expect(result.replyMessage).toContain("register nahi hai");
  });

  it("known guardian querying 'fee' receives linked child fee breakdown", async () => {
    // Find an active student with a guardian phone
    const student = await db.student.findFirst({
      where: { guardianPhone: { not: "" }, status: "ACTIVE" },
      include: { invoices: true },
    });

    if (student) {
      const result = await processInboundWhatsAppMessage({
        from: student.guardianPhone,
        text: "fee",
      });

      expect(result.matched).toBe(true);
      expect(result.intent).toBe("FEE");
      expect(result.studentCount).toBeGreaterThan(0);
      expect(result.replyMessage).toContain(student.name);
      expect(result.replyMessage).toContain(student.admissionNo);
    }
  });

  it("known guardian querying 'hazri' or 'attendance' receives attendance summary", async () => {
    const student = await db.student.findFirst({
      where: { guardianPhone: { not: "" }, status: "ACTIVE" },
    });

    if (student) {
      const result = await processInboundWhatsAppMessage({
        from: student.guardianPhone,
        text: "hazri",
      });

      expect(result.matched).toBe(true);
      expect(result.intent).toBe("ATTENDANCE");
      expect(result.replyMessage).toContain("Attendance");
      expect(result.replyMessage).toContain(student.name);
    }
  });

  it("known guardian querying 'result' receives published test marks", async () => {
    const student = await db.student.findFirst({
      where: { guardianPhone: { not: "" }, status: "ACTIVE" },
    });

    if (student) {
      const result = await processInboundWhatsAppMessage({
        from: student.guardianPhone,
        text: "result",
      });

      expect(result.matched).toBe(true);
      expect(result.intent).toBe("RESULT");
      expect(result.replyMessage).toContain(student.name);
    }
  });

  it("unrecognized query returns interactive help menu", async () => {
    const student = await db.student.findFirst({
      where: { guardianPhone: { not: "" }, status: "ACTIVE" },
    });

    if (student) {
      const result = await processInboundWhatsAppMessage({
        from: student.guardianPhone,
        text: "hello academy",
      });

      expect(result.matched).toBe(true);
      expect(result.intent).toBe("HELP");
      expect(result.replyMessage).toContain("AcademyHub WhatsApp Service");
      expect(result.replyMessage).toContain("fee");
      expect(result.replyMessage).toContain("attendance");
    }
  });
});

describe("Phase 14: QR Attendance Token Signing & Expiration", () => {
  it("creates a cryptographically signed QR token valid for 10 minutes", () => {
    const { token, expiresAt, date } = createQRToken({
      batchId: "batch-123",
      academyId: "academy-456",
      expiresInMinutes: 10,
    });

    expect(token).toBeDefined();
    expect(token).toContain(".");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Verify token immediately
    const verification = verifyQRToken(token);
    expect(verification.valid).toBe(true);
    expect(verification.payload?.batchId).toBe("batch-123");
    expect(verification.payload?.academyId).toBe("academy-456");
  });

  it("rejects tampered token signature", () => {
    const { token } = createQRToken({
      batchId: "batch-123",
      academyId: "academy-456",
    });

    const [payloadB64, signature] = token.split(".");
    const tamperedToken = `${payloadB64}.deadbeef12345678`;

    const verification = verifyQRToken(tamperedToken);
    expect(verification.valid).toBe(false);
    expect(verification.error).toBe("INVALID_SIGNATURE");
  });

  it("rejects expired QR token with clean error message", () => {
    // Generate token with negative duration (-1 minute)
    const { token } = createQRToken({
      batchId: "batch-123",
      academyId: "academy-456",
      expiresInMinutes: -1,
    });

    const verification = verifyQRToken(token);
    expect(verification.valid).toBe(false);
    expect(verification.error).toBe("EXPIRED");
    expect(verification.errorMessage).toContain("expired (valid for 10 minutes only)");
  });

  it("rejects malformed token strings", () => {
    expect(verifyQRToken("").valid).toBe(false);
    expect(verifyQRToken("invalid-no-dot").valid).toBe(false);
    expect(verifyQRToken("abc.def").valid).toBe(false);
  });
});

describe("Phase 14: Mobile QR Scan Attendance & Duplicate Scan Guard", () => {
  it("marks attendance PRESENT and ignores duplicate scan on same day", async () => {
    // Find active student and enrollment
    const student = await db.student.findFirst({
      where: {
        userId: { not: null },
        status: "ACTIVE",
        enrollments: { some: { status: "ACTIVE" } },
      },
      include: {
        enrollments: {
          where: { status: "ACTIVE" },
          include: { batch: true },
        },
      },
    });

    if (!student || !student.userId || student.enrollments.length === 0) {
      return; // Skip if seed data missing
    }

    const enrollment = student.enrollments[0];
    const testDate = "2026-11-20"; // Dedicated unique test date

    // Clean up any existing attendance for this test date
    await db.attendance.deleteMany({
      where: {
        enrollmentId: enrollment.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
      },
    });

    // 1. Generate QR token for this batch & date
    const { token } = createQRToken({
      batchId: enrollment.batchId,
      academyId: student.academyId,
      date: testDate,
      expiresInMinutes: 10,
    });

    // 2. First Scan: Should mark PRESENT
    const firstScan = await markAttendanceViaQR({
      token,
      studentUserId: student.userId,
    });

    expect(firstScan.success).toBe(true);
    expect(firstScan.status).toBe("MARKED_PRESENT");
    expect(firstScan.message).toContain("Attendance marked PRESENT");

    // Verify record in DB
    const inDb = await db.attendance.findFirst({
      where: {
        enrollmentId: enrollment.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
      },
    });
    expect(inDb).toBeDefined();
    expect(inDb?.status).toBe(AttendanceStatus.PRESENT);

    // 3. Second Scan (Duplicate): Should be ignored, NOT throw, NOT double-mark
    const secondScan = await markAttendanceViaQR({
      token,
      studentUserId: student.userId,
    });

    expect(secondScan.success).toBe(true);
    expect(secondScan.status).toBe("ALREADY_RECORDED");
    expect(secondScan.message).toContain("already been recorded");

    // Count records in DB: must still be exactly 1
    const count = await db.attendance.count({
      where: {
        enrollmentId: enrollment.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
      },
    });
    expect(count).toBe(1);

    // Clean up test record
    await db.attendance.deleteMany({
      where: {
        enrollmentId: enrollment.id,
        date: new Date(`${testDate}T00:00:00.000Z`),
      },
    });
  });

  it("rejects expired QR token when student attempts to mark attendance", async () => {
    const student = await db.student.findFirst({
      where: { userId: { not: null }, status: "ACTIVE" },
      include: { enrollments: true },
    });

    if (!student || !student.userId || student.enrollments.length === 0) {
      return;
    }

    const enrollment = student.enrollments[0];

    // Generate expired token (-5 minutes)
    const { token } = createQRToken({
      batchId: enrollment.batchId,
      academyId: student.academyId,
      expiresInMinutes: -5,
    });

    const result = await markAttendanceViaQR({
      token,
      studentUserId: student.userId,
    });

    expect(result.success).toBe(false);
    expect(result.status).toBe("ERROR");
    expect(result.message).toContain("expired");
  });
});
