"use server";

import { auth } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { requireTeacher, requireAdmin } from "@/lib/permissions";
import { createQRToken, generateQRCodeDataUrl, markAttendanceViaQR } from "@/lib/qr";
import { db } from "@/lib/db";

/**
 * Server action: Teacher/Admin generates a live, 10-minute QR code for a batch
 */
export async function generateBatchQRAction(batchId: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const tenant = await requireTenant();

  const batch = await db.batch.findFirst({
    where: {
      id: batchId,
      academyId: tenant.academyId,
    },
    include: {
      class: true,
    },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  // Teacher authorization check: teacher can only generate QR for their assigned batches
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only generate QR codes for your assigned batches.");
    }
  } else if (session.user.role !== "ADMIN" && (session.user.role as string) !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  const { token, expiresAt, date } = createQRToken({
    batchId: batch.id,
    academyId: tenant.academyId,
    expiresInMinutes: 10,
  });

  // Construct absolute or relative scan URL
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const scanUrl = `${baseUrl}/student/attendance/scan?token=${encodeURIComponent(token)}`;
  const qrDataUrl = await generateQRCodeDataUrl(scanUrl);

  return {
    success: true,
    token,
    expiresAt: expiresAt.toISOString(),
    date,
    scanUrl,
    qrDataUrl,
    batchName: `${batch.class.name} ${batch.class.section} - ${batch.name}`,
    batchTiming: batch.timing,
  };
}

/**
 * Server action: Student confirms attendance from scanned QR code
 */
export async function confirmQRScanAction(token: string) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("You must be logged in as a student to confirm attendance.");
  }

  const result = await markAttendanceViaQR({
    token,
    studentUserId: session.user.id,
  });

  return result;
}
