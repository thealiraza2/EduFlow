import { db } from "../src/lib/db";
import { processInboundWhatsAppMessage } from "../src/lib/whatsapp-bot";
import { createQRToken, verifyQRToken, markAttendanceViaQR } from "../src/lib/qr";
import { AttendanceStatus } from "@prisma/client";

async function main() {
  console.log("\n=======================================================");
  console.log("   ACADEMYHUB - PHASE 14 VERIFICATION SUITE           ");
  console.log("   WhatsApp Business Bot + QR Attendance (No Biometrics)");
  console.log("=======================================================\n");

  // Step 1: WhatsApp Bot Inbound Query Verification
  console.log("[1] Testing WhatsApp Bot with Seeded Guardian Phone...");

  const student = await db.student.findFirst({
    where: {
      status: "ACTIVE",
      guardianPhone: { not: "" },
    },
    include: {
      invoices: true,
      enrollments: { include: { batch: true } },
    },
  });

  if (!student) {
    throw new Error("No active student with guardian phone found.");
  }

  console.log(`    Selected Student: ${student.name} (${student.admissionNo})`);
  console.log(`    Guardian Phone: ${student.guardianPhone} (${student.guardianName})`);

  // 1A. Send "fee" keyword
  console.log("\n    -> Testing keyword: 'fee'");
  const feeResponse = await processInboundWhatsAppMessage({
    from: student.guardianPhone,
    text: "fee",
  });

  console.log(`       Bot Intent: ${feeResponse.intent} | Matched: ${feeResponse.matched}`);
  console.log(`       Bot Reply:\n${feeResponse.replyMessage.split("\n").map(l => "         " + l).join("\n")}`);

  if (!feeResponse.matched || feeResponse.intent !== "FEE" || !feeResponse.replyMessage.includes(student.name)) {
    throw new Error("Fee reply did not match expected student details!");
  }

  // Check NotificationLog
  const feeLog = await db.notificationLog.findFirst({
    where: { id: feeResponse.logId },
  });
  if (!feeLog || feeLog.channel !== "WHATSAPP") {
    throw new Error("Outbound WhatsApp reply not properly logged in NotificationLog!");
  }
  console.log(`       ✓ Reply logged in NotificationLog (ID: ${feeLog.id}, Channel: ${feeLog.channel})`);

  // 1B. Send "hazri" keyword
  console.log("\n    -> Testing keyword: 'hazri' (attendance)");
  const attResponse = await processInboundWhatsAppMessage({
    from: student.guardianPhone,
    text: "hazri",
  });
  console.log(`       Bot Intent: ${attResponse.intent} | Matched: ${attResponse.matched}`);
  if (!attResponse.matched || attResponse.intent !== "ATTENDANCE") {
    throw new Error("Attendance reply did not trigger ATTENDANCE intent!");
  }
  console.log("       ✓ Attendance keyword successfully routed.");

  // 1C. Test unknown phone number (Isolation Invariant)
  console.log("\n    -> Testing unknown phone number (0399-9999999)...");
  const unknownResponse = await processInboundWhatsAppMessage({
    from: "03999999999",
    text: "fee",
  });
  console.log(`       Unknown Reply: "${unknownResponse.replyMessage}"`);
  if (unknownResponse.matched || !unknownResponse.replyMessage.includes("register nahi hai")) {
    throw new Error("Unknown sender was not properly rejected!");
  }
  console.log("       ✓ Unknown number strictly rejected with isolation message.");

  // Step 2: QR Attendance System Verification
  console.log("\n[2] Testing QR Attendance Generation & Mobile Scanning...");

  // Find enrolled student with linked user account
  const studentWithUser = await db.student.findFirst({
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

  if (!studentWithUser || !studentWithUser.userId) {
    throw new Error("No active student with user account found for QR scan test.");
  }

  const enrollment = studentWithUser.enrollments[0];
  const testDate = "2026-11-25";

  // Clean up any test attendance on this date
  await db.attendance.deleteMany({
    where: {
      enrollmentId: enrollment.id,
      date: new Date(`${testDate}T00:00:00.000Z`),
    },
  });

  // 2A. Generate 10-Minute QR Token
  console.log(`    Batch: ${enrollment.batch.name} (ID: ${enrollment.batchId})`);
  const qrGen = createQRToken({
    batchId: enrollment.batchId,
    academyId: studentWithUser.academyId,
    date: testDate,
    expiresInMinutes: 10,
  });

  console.log(`    Generated Token: ${qrGen.token.slice(0, 30)}... | Expires: ${qrGen.expiresAt.toISOString()}`);
  const verifyValid = verifyQRToken(qrGen.token);
  if (!verifyValid.valid) {
    throw new Error("Generated token failed immediate verification!");
  }
  console.log("    ✓ Token signature and 10-minute expiry verified.");

  // 2B. First Mobile Scan: Should mark PRESENT
  console.log("\n    -> Student scans QR code (First Attempt)...");
  const firstScan = await markAttendanceViaQR({
    token: qrGen.token,
    studentUserId: studentWithUser.userId,
  });

  console.log(`       Scan Status: ${firstScan.status} | Success: ${firstScan.success}`);
  console.log(`       Message: "${firstScan.message}"`);
  if (!firstScan.success || firstScan.status !== "MARKED_PRESENT") {
    throw new Error(`Expected MARKED_PRESENT, got ${firstScan.status}`);
  }

  const attRow = await db.attendance.findFirst({
    where: {
      enrollmentId: enrollment.id,
      date: new Date(`${testDate}T00:00:00.000Z`),
    },
  });
  if (!attRow || attRow.status !== AttendanceStatus.PRESENT) {
    throw new Error("Attendance record not found or not PRESENT in database!");
  }
  console.log(`       ✓ Attendance record created in DB with status PRESENT (ID: ${attRow.id})`);

  // 2C. Duplicate Mobile Scan: Should be ignored, NOT throw, NOT double-mark
  console.log("\n    -> Student scans QR code again (Duplicate Scan Attempt)...");
  const secondScan = await markAttendanceViaQR({
    token: qrGen.token,
    studentUserId: studentWithUser.userId,
  });

  console.log(`       Scan Status: ${secondScan.status} | Success: ${secondScan.success}`);
  console.log(`       Message: "${secondScan.message}"`);
  if (!secondScan.success || secondScan.status !== "ALREADY_RECORDED") {
    throw new Error(`Expected ALREADY_RECORDED for duplicate scan, got ${secondScan.status}`);
  }

  const countAfter = await db.attendance.count({
    where: {
      enrollmentId: enrollment.id,
      date: new Date(`${testDate}T00:00:00.000Z`),
    },
  });
  if (countAfter !== 1) {
    throw new Error(`Expected exactly 1 attendance row, found ${countAfter}`);
  }
  console.log("       ✓ Duplicate scan safely ignored (0 duplicate records inserted).");

  // 2D. Expired QR Token (>10 min past expiry)
  console.log("\n    -> Attempting scan with EXPIRED QR token (-15 minutes)...");
  const expiredGen = createQRToken({
    batchId: enrollment.batchId,
    academyId: studentWithUser.academyId,
    date: testDate,
    expiresInMinutes: -15, // Expired 15 minutes ago
  });

  const expiredScan = await markAttendanceViaQR({
    token: expiredGen.token,
    studentUserId: studentWithUser.userId,
  });

  console.log(`       Scan Status: ${expiredScan.status} | Success: ${expiredScan.success}`);
  console.log(`       Message: "${expiredScan.message}"`);
  if (expiredScan.success || expiredScan.status !== "ERROR" || !expiredScan.message.includes("expired")) {
    throw new Error("Expired QR code was not properly rejected!");
  }
  console.log("       ✓ Expired QR code rejected with clean human-readable error message.");

  // Clean up test attendance
  await db.attendance.deleteMany({
    where: {
      enrollmentId: enrollment.id,
      date: new Date(`${testDate}T00:00:00.000Z`),
    },
  });
  console.log("       ✓ Test attendance records cleaned up.");

  console.log("\n=======================================================");
  console.log("   PHASE 14 VERIFICATION PASSED SUCCESSFULLY!         ");
  console.log("=======================================================\n");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
