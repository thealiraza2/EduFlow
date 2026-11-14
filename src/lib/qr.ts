/**
 * AcademyHub - QR Code Attendance Engine (Phase 14)
 *
 * Implements time-limited, cryptographically signed QR codes:
 * - Signed HMAC-SHA256 token valid for 10 minutes.
 * - Server-side validation of token signature, expiration window, and active student enrollment.
 * - One scan per student per day: duplicate scan is ignored (not double-marked).
 * - Clean rejection when expired.
 */

import crypto from "crypto";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { AttendanceStatus } from "@prisma/client";

export interface QRTokenPayload {
  batchId: string;
  academyId: string;
  date: string; // YYYY-MM-DD
  exp: number; // Unix timestamp in ms
  nonce: string;
}

export interface QRVerificationResult {
  valid: boolean;
  payload?: QRTokenPayload;
  error?: "EXPIRED" | "INVALID_SIGNATURE" | "MALFORMED";
  errorMessage?: string;
}

export interface QRScanResult {
  success: boolean;
  status: "MARKED_PRESENT" | "ALREADY_RECORDED" | "ERROR";
  message: string;
  date?: string;
  batchName?: string;
  studentName?: string;
}

function getQRSecret(): string {
  return (
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    "academyhub_secure_qr_hmac_secret_key"
  );
}

/**
 * Creates a cryptographically signed time-limited QR token
 */
export function createQRToken(params: {
  batchId: string;
  academyId: string;
  date?: string;
  expiresInMinutes?: number;
}): { token: string; expiresAt: Date; date: string } {
  const expiresInMinutes = params.expiresInMinutes ?? 10;
  const dateStr =
    params.date || new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const exp = Date.now() + expiresInMinutes * 60 * 1000;
  const nonce = crypto.randomBytes(8).toString("hex");

  const payload: QRTokenPayload = {
    batchId: params.batchId,
    academyId: params.academyId,
    date: dateStr,
    exp,
    nonce,
  };

  const payloadStr = JSON.stringify(payload);
  const payloadB64 = Buffer.from(payloadStr, "utf8").toString("base64url");

  const signature = crypto
    .createHmac("sha256", getQRSecret())
    .update(payloadB64)
    .digest("hex");

  const token = `${payloadB64}.${signature}`;

  return {
    token,
    expiresAt: new Date(exp),
    date: dateStr,
  };
}

/**
 * Verifies QR token signature and expiration window
 */
export function verifyQRToken(token: string): QRVerificationResult {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return {
      valid: false,
      error: "MALFORMED",
      errorMessage: "Invalid or malformed QR token format.",
    };
  }

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) {
    return {
      valid: false,
      error: "MALFORMED",
      errorMessage: "Token missing payload or signature.",
    };
  }

  // Verify HMAC-SHA256 signature
  const expectedSig = crypto
    .createHmac("sha256", getQRSecret())
    .update(payloadB64)
    .digest("hex");

  try {
    const isSigMatch = crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSig, "hex")
    );
    if (!isSigMatch) {
      return {
        valid: false,
        error: "INVALID_SIGNATURE",
        errorMessage: "QR code signature verification failed. Untrusted token.",
      };
    }
  } catch {
    return {
      valid: false,
      error: "INVALID_SIGNATURE",
      errorMessage: "Malformed signature format.",
    };
  }

  // Parse and check expiration
  try {
    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload: QRTokenPayload = JSON.parse(payloadStr);

    if (Date.now() > payload.exp) {
      return {
        valid: false,
        error: "EXPIRED",
        errorMessage:
          "This QR code has expired (valid for 10 minutes only). Please ask your teacher to generate a new QR code.",
      };
    }

    return {
      valid: true,
      payload,
    };
  } catch (err: any) {
    return {
      valid: false,
      error: "MALFORMED",
      errorMessage: `Could not parse QR token: ${err.message}`,
    };
  }
}

/**
 * Generates an SVG or PNG Data URL representation of a URL/token
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    width: 320,
    margin: 2,
    color: {
      dark: "#0f172a", // slate-900
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Processes attendance marking when student scans QR code
 */
export async function markAttendanceViaQR({
  token,
  studentUserId,
}: {
  token: string;
  studentUserId: string;
}): Promise<QRScanResult> {
  // 1. Verify token
  const verifyResult = verifyQRToken(token);
  if (!verifyResult.valid || !verifyResult.payload) {
    return {
      success: false,
      status: "ERROR",
      message:
        verifyResult.errorMessage ||
        "Invalid attendance QR token. Verification failed.",
    };
  }

  const { batchId, academyId, date: dateStr } = verifyResult.payload;

  // 2. Identify student from user account
  const student = await db.student.findFirst({
    where: {
      userId: studentUserId,
      academyId,
      status: "ACTIVE",
    },
  });

  if (!student) {
    return {
      success: false,
      status: "ERROR",
      message:
        "Student record not found for this account. Ensure you are signed in as an enrolled student.",
    };
  }

  // 3. Verify active enrollment in this specific batch
  const enrollment = await db.enrollment.findFirst({
    where: {
      studentId: student.id,
      batchId,
      academyId,
      status: "ACTIVE",
    },
    include: {
      batch: {
        include: {
          class: true,
        },
      },
    },
  });

  if (!enrollment) {
    return {
      success: false,
      status: "ERROR",
      message:
        "You are not actively enrolled in this batch. Attendance cannot be recorded.",
    };
  }

  const targetDate = new Date(`${dateStr}T00:00:00.000Z`);

  // 4. Duplicate scan guard: One scan per student per day
  const existingAttendance = await db.attendance.findFirst({
    where: {
      enrollmentId: enrollment.id,
      date: targetDate,
    },
  });

  const batchDisplayName = `${enrollment.batch.class.name} - ${enrollment.batch.name}`;

  if (existingAttendance) {
    // Duplicate scan is ignored, NOT double-marked
    return {
      success: true,
      status: "ALREADY_RECORDED",
      message: `Your attendance for ${batchDisplayName} on ${dateStr} has already been recorded (${existingAttendance.status}). Duplicate scan ignored.`,
      date: dateStr,
      batchName: batchDisplayName,
      studentName: student.name,
    };
  }

  // 5. Mark Attendance PRESENT
  await db.attendance.create({
    data: {
      academyId,
      enrollmentId: enrollment.id,
      date: targetDate,
      status: AttendanceStatus.PRESENT,
      remarks: "Marked via mobile QR code scan",
    },
  });

  return {
    success: true,
    status: "MARKED_PRESENT",
    message: `Attendance marked PRESENT for ${batchDisplayName} on ${dateStr}!`,
    date: dateStr,
    batchName: batchDisplayName,
    studentName: student.name,
  };
}
