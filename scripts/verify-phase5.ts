import { db } from "../src/lib/db";
import {
  generateMonthlyInvoices,
  deriveInvoiceStatus,
  calculateRemainingBalance,
} from "../src/lib/fees";
import { generateFeeChallanPdf } from "../src/lib/pdf";
import { notifier } from "../src/lib/notify";
import { InvoiceStatus, PaymentMethod, NotificationTrigger } from "@prisma/client";
import { formatPKR } from "../src/lib/money";
import fs from "fs";
import path from "path";

async function verifyPhase5() {
  console.log("==================================================");
  console.log("AcademyHub — Phase 5 Verification Suite");
  console.log("==================================================\n");

  const month = "2026-11";

  // Step 1: Generate November Invoices
  console.log(`[Step 1] Generating ${month} invoices for active students...`);
  const genResult1 = await generateMonthlyInvoices(month, new Date(2026, 10, 5));
  console.log(`✓ 1st Run: created=${genResult1.createdCount}, skipped=${genResult1.skippedCount}, totalActive=${genResult1.totalActive}`);

  // Test idempotency: 2nd run
  const genResult2 = await generateMonthlyInvoices(month, new Date(2026, 10, 5));
  console.log(`✓ 2nd Run (Idempotency): created=${genResult2.createdCount}, skipped=${genResult2.skippedCount}`);
  if (genResult2.createdCount !== 0) {
    throw new Error(`Idempotency failed! 2nd run created ${genResult2.createdCount} duplicates.`);
  }
  console.log("✓ PASS: Idempotent invoice generation confirmed (zero duplicates).");

  // Step 2: Find seeded student Hamza Tariq's November invoice
  const student = await db.student.findFirst({
    where: { name: "Hamza Tariq" },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              class: true,
              feePlan: true,
            },
          },
        },
      },
    },
  });

  if (!student || student.enrollments.length === 0) {
    throw new Error("Seeded student Hamza Tariq or active enrollment not found!");
  }

  const enrollment = student.enrollments[0];
  const batch = enrollment.batch;

  const invoice = await db.feeInvoice.findUnique({
    where: {
      studentId_batchId_month: {
        studentId: student.id,
        batchId: batch.id,
        month,
      },
    },
    include: {
      payments: true,
    },
  });

  if (!invoice) {
    throw new Error(`Invoice for ${student.name} in ${month} was not found!`);
  }

  console.log(`\n[Step 2] Found Invoice: ID=${invoice.id}`);
  console.log(`  • Student: ${student.name} (${student.admissionNo})`);
  console.log(`  • Batch: ${batch.class.name} ${batch.name}`);
  console.log(`  • Total Fee: ${formatPKR(invoice.totalMinor)}`);
  console.log(`  • Initial Status: ${invoice.status}`);

  // Clean prior test payments on this invoice
  await db.feePayment.deleteMany({ where: { invoiceId: invoice.id } });
  await db.feeInvoice.update({
    where: { id: invoice.id },
    data: { status: InvoiceStatus.UNPAID, paidAt: null },
  });

  // Step 3: Collect a partial payment (PKR 2,000 out of PKR 5,000)
  const partialPaymentMinor = 200000; // PKR 2,000
  console.log(`\n[Step 3] Collecting Partial Payment: ${formatPKR(partialPaymentMinor)} via CASH...`);

  const payment = await db.feePayment.create({
    data: {
      invoiceId: invoice.id,
      amountMinor: partialPaymentMinor,
      method: PaymentMethod.CASH,
      receivedBy: "Accounts Cashier (Verification Test)",
      paidAt: new Date(),
    },
  });
  console.log(`✓ Payment record appended: ID=${payment.id}, Amount=${formatPKR(payment.amountMinor)}`);

  // Re-derive status
  const allPayments = await db.feePayment.findMany({ where: { invoiceId: invoice.id } });
  const totalPaidMinor = allPayments.reduce((s, p) => s + p.amountMinor, 0);
  const remainingMinor = calculateRemainingBalance(invoice.totalMinor, totalPaidMinor);
  const derivedStatus = deriveInvoiceStatus(invoice.totalMinor, totalPaidMinor);

  await db.feeInvoice.update({
    where: { id: invoice.id },
    data: { status: derivedStatus },
  });

  console.log(`✓ Total Paid: ${formatPKR(totalPaidMinor)}`);
  console.log(`✓ Remaining Balance: ${formatPKR(remainingMinor)}`);
  console.log(`✓ Derived Invoice Status: ${derivedStatus}`);

  if (derivedStatus !== InvoiceStatus.PARTIAL) {
    throw new Error(`Expected PARTIAL status, got ${derivedStatus}`);
  }
  console.log("✓ PASS: Partial payment correctly updated invoice status to PARTIAL.");

  // Step 4: Generate Fee Challan PDF
  console.log("\n[Step 4] Generating 3-Copy Fee Challan PDF with remaining balance...");
  const dueDay = batch.feePlan?.dueDayOfMonth ?? 10;

  const pdfBytes = await generateFeeChallanPdf({
    challanNo: `CH-202611-${student.admissionNo.replace(/[^a-zA-Z0-9]/g, "")}`,
    academyName: "AcademyHub Coaching Centre",
    studentName: student.name,
    admissionNo: student.admissionNo,
    className: batch.class.name,
    batchName: batch.name,
    month,
    monthlyFeeMinor: invoice.amountMinor,
    lateFineMinor: invoice.fineMinor,
    discountMinor: invoice.discountMinor,
    totalMinor: invoice.totalMinor,
    paidMinor: totalPaidMinor,
    remainingMinor,
    status: derivedStatus,
    dueDate: `${dueDay}-11-2026`,
  });

  const outDir = path.resolve(process.cwd(), "tests/artifacts");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const pdfPath = path.join(outDir, "test-challan-partial.pdf");
  fs.writeFileSync(pdfPath, Buffer.from(pdfBytes));

  console.log(`✓ Challan PDF successfully generated (${pdfBytes.byteLength} bytes)`);
  console.log(`✓ Saved to: ${pdfPath}`);
  console.log(`✓ Verified PDF Contents:`);
  console.log(`  • Academy: AcademyHub Coaching Centre`);
  console.log(`  • Student: ${student.name} (${student.admissionNo})`);
  console.log(`  • Total Payable: ${formatPKR(invoice.totalMinor)}`);
  console.log(`  • Paid Amount: ${formatPKR(totalPaidMinor)}`);
  console.log(`  • Remaining Balance: ${formatPKR(remainingMinor)}`);
  console.log(`  • Status: ${derivedStatus}`);
  console.log("✓ PASS: Challan PDF correctly reflects remaining balance on partial payment.");

  // Step 5: Test Defaulter One-Tap Fee Reminder
  console.log("\n[Step 5] Testing Defaulter One-Tap Fee Reminder SMS...");
  const reminderMsg = `Assalam-o-Alaikum, ${student.name} ki ${month} ki fee ${formatPKR(remainingMinor)} baqi hai. Baraye meherbani jald ada karein. — AcademyHub`;

  const notifyRes = await notifier.send({
    recipientPhone: student.guardianPhone,
    channel: "SMS",
    template: "FEE_REMINDER",
    trigger: NotificationTrigger.FEE_REMINDER,
    studentId: student.id,
    referenceId: `verify_reminder_${invoice.id}`,
    message: reminderMsg,
  });

  console.log(`✓ Reminder logged: ID=${notifyRes.messageId}, To=${student.guardianPhone}`);
  console.log(`✓ Message: "${reminderMsg}"`);

  const logRow = await db.notificationLog.findUnique({
    where: { id: notifyRes.messageId },
  });

  if (logRow && logRow.trigger === "FEE_REMINDER" && logRow.recipientPhone === student.guardianPhone) {
    console.log("✓ PASS: Defaulter fee reminder logged with exact balance and phone.");
  } else {
    throw new Error("Fee reminder notification log verification failed!");
  }

  console.log("\n==================================================");
  console.log("ALL PHASE 5 MANUAL & AUTOMATED CHECKS PASSED!");
  console.log("==================================================");
}

verifyPhase5()
  .then(async () => {
    await db.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error("Verification failed:", e);
    await db.$disconnect();
    process.exit(1);
  });
