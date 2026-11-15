import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  calculateInvoiceTotal,
  calculateLateFine,
  calculateRemainingBalance,
  deriveInvoiceStatus,
  generateMonthlyInvoices,
  buildFeeReminderMessage,
} from "@/lib/fees";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

describe("Phase 5: Fees, Invoices, Append-Only Payments & Status Derivation", () => {
  let testClassId: string;
  let testBatchId: string;
  let testStudentId: string;
  let testEnrollmentId: string;
  const testMonth = "2026-11";

  beforeAll(async () => {
    // Setup test class, batch with FeePlan, and enrolled student
    const cls = await db.class.create({
      data: {
        academyId: "seed-academy-id",
        name: "Test-Fee-10th",
        section: "X",
        capacity: 30,
      },
    });
    testClassId = cls.id;

    const batch = await db.batch.create({
      data: {
        academyId: "seed-academy-id",
        classId: testClassId,
        name: "Morning Science",
        timing: "9-11 AM",
        feeMinor: 500000, // PKR 5,000
        feePlan: {
          create: {
            academyId: "seed-academy-id",
            monthlyFeeMinor: 500000, // PKR 5,000
            admissionFeeMinor: 100000, // PKR 1,000
            lateFineMinor: 30000, // PKR 300
            dueDayOfMonth: 10,
          },
        },
      },
    });
    testBatchId = batch.id;

    const student = await db.student.create({
      data: {
        academyId: "seed-academy-id",
        admissionNo: `TEST-FEE-${Date.now()}`,
        name: "Usman Tariq",
        guardianName: "Tariq Mahmood",
        guardianPhone: "03001234500",
      },
    });
    testStudentId = student.id;

    const enr = await db.enrollment.create({
      data: {
        academyId: "seed-academy-id",
        studentId: testStudentId,
        batchId: testBatchId,
      },
    });
    testEnrollmentId = enr.id;
  });

  afterAll(async () => {
    // Cleanup test records
    if (testStudentId) {
      await db.feePayment.deleteMany({
        where: { invoice: { studentId: testStudentId } },
      });
      await db.feeInvoice.deleteMany({ where: { studentId: testStudentId } });
      await db.enrollment.deleteMany({ where: { studentId: testStudentId } });
      await db.student.delete({ where: { id: testStudentId } });
    }
    if (testBatchId) {
      await db.feePlan.deleteMany({ where: { batchId: testBatchId } });
      await db.batch.delete({ where: { id: testBatchId } });
    }
    if (testClassId) {
      await db.class.delete({ where: { id: testClassId } });
    }
  });

  it("calculates invoice total strictly in integer minor units (fee - discount + fine)", () => {
    const feeMinor = 500000; // PKR 5,000
    const admissionMinor = 0;
    const fineMinor = 30000; // PKR 300
    const discountMinor = 50000; // PKR 500

    const breakdown = calculateInvoiceTotal(feeMinor, admissionMinor, fineMinor, discountMinor);

    // (500,000 + 0 + 30,000) - 50,000 = 480,000 paisa (PKR 4,800)
    expect(breakdown.monthlyFeeMinor).toBe(500000);
    expect(breakdown.lateFineMinor).toBe(30000);
    expect(breakdown.discountMinor).toBe(50000);
    expect(breakdown.totalMinor).toBe(480000);

    // Remaining balance check
    expect(calculateRemainingBalance(breakdown.totalMinor, 200000)).toBe(280000);
    expect(calculateRemainingBalance(breakdown.totalMinor, 480000)).toBe(0);
  });

  it("calculates late fine only after dueDayOfMonth has passed", () => {
    const dueDay = 10;
    const month = "2026-11";
    const fineMinor = 30000; // PKR 300

    // Date on or before 10th -> fine is 0
    const onDueDate = new Date(2026, 10, 10, 15, 0, 0); // 10 Nov 2026 3pm
    expect(calculateLateFine(dueDay, month, fineMinor, onDueDate)).toBe(0);

    // Date after 10th -> fine is 30,000 paisa
    const pastDueDate = new Date(2026, 10, 11, 10, 0, 0); // 11 Nov 2026 10am
    expect(calculateLateFine(dueDay, month, fineMinor, pastDueDate)).toBe(30000);
  });

  it("status derivation (Invariant 2): zero -> UNPAID, partial -> PARTIAL, full -> PAID", () => {
    const totalMinor = 500000; // PKR 5,000

    // 0 paid -> UNPAID
    expect(deriveInvoiceStatus(totalMinor, 0)).toBe(InvoiceStatus.UNPAID);

    // partial payment -> PARTIAL
    expect(deriveInvoiceStatus(totalMinor, 100000)).toBe(InvoiceStatus.PARTIAL);
    expect(deriveInvoiceStatus(totalMinor, 499999)).toBe(InvoiceStatus.PARTIAL);

    // full payment -> PAID
    expect(deriveInvoiceStatus(totalMinor, 500000)).toBe(InvoiceStatus.PAID);

    // overpayment -> PAID
    expect(deriveInvoiceStatus(totalMinor, 550000)).toBe(InvoiceStatus.PAID);
  });

  it("idempotent generation: running generation twice for the same month creates ZERO duplicates", async () => {
    // Clean any prior invoices for this student in this test month
    await db.feeInvoice.deleteMany({
      where: {
        studentId: testStudentId,
        batchId: testBatchId,
        month: testMonth,
      },
    });

    // 1st run: should create invoice
    const run1 = await generateMonthlyInvoices(testMonth, new Date(2026, 10, 5), db, { studentId: testStudentId }); // 5th Nov (before due date)
    expect(run1.createdCount).toBe(1);

    const invoicesAfterRun1 = await db.feeInvoice.findMany({
      where: {
        studentId: testStudentId,
        batchId: testBatchId,
        month: testMonth,
      },
    });
    expect(invoicesAfterRun1.length).toBe(1);
    expect(invoicesAfterRun1[0].status).toBe(InvoiceStatus.UNPAID);
    expect(invoicesAfterRun1[0].amountMinor).toBe(500000);
    expect(invoicesAfterRun1[0].totalMinor).toBe(500000);

    const firstInvoiceId = invoicesAfterRun1[0].id;

    // 2nd run: should skip existing invoice (idempotent)
    const run2 = await generateMonthlyInvoices(testMonth, new Date(2026, 10, 5), db, { studentId: testStudentId });
    expect(run2.skippedCount).toBe(1);
    expect(run2.createdCount).toBe(0);

    const invoicesAfterRun2 = await db.feeInvoice.findMany({
      where: {
        studentId: testStudentId,
        batchId: testBatchId,
        month: testMonth,
      },
    });
    // Count MUST still be exactly 1! Zero duplicate rows!
    expect(invoicesAfterRun2.length).toBe(1);
    expect(invoicesAfterRun2[0].id).toBe(firstInvoiceId);
  });

  it("append-only payments: partial payment records PARTIAL status; remaining balance payment records PAID status", async () => {
    const invoice = await db.feeInvoice.findUnique({
      where: {
        studentId_batchId_month: {
          studentId: testStudentId,
          batchId: testBatchId,
          month: testMonth,
        },
      },
    });

    expect(invoice).toBeDefined();
    const invoiceId = invoice!.id;

    // Payment 1: Partial (PKR 2,000 / 200,000 paisa)
    await db.feePayment.create({
      data: {
        academyId: "seed-academy-id",
        invoiceId,
        amountMinor: 200000,
        method: PaymentMethod.CASH,
        receivedBy: "Accounts Office",
        paidAt: new Date(),
      },
    });

    // Re-derive status
    const payments1 = await db.feePayment.findMany({ where: { invoiceId } });
    expect(payments1.length).toBe(1);
    const paid1 = payments1.reduce((sum, p) => sum + p.amountMinor, 0);
    const status1 = deriveInvoiceStatus(invoice!.totalMinor, paid1);
    expect(status1).toBe(InvoiceStatus.PARTIAL);

    await db.feeInvoice.update({
      where: { id: invoiceId },
      data: { status: status1 },
    });

    // Payment 2: Remaining balance (PKR 3,000 / 300,000 paisa)
    await db.feePayment.create({
      data: {
        academyId: "seed-academy-id",
        invoiceId,
        amountMinor: 300000,
        method: PaymentMethod.JAZZCASH,
        receivedBy: "Admin Staff",
        paidAt: new Date(),
      },
    });

    // Re-derive status
    const payments2 = await db.feePayment.findMany({ where: { invoiceId } });
    expect(payments2.length).toBe(2); // Append-only: exactly 2 payment rows exist
    const paid2 = payments2.reduce((sum, p) => sum + p.amountMinor, 0);
    expect(paid2).toBe(500000);

    const status2 = deriveInvoiceStatus(invoice!.totalMinor, paid2);
    expect(status2).toBe(InvoiceStatus.PAID);

    await db.feeInvoice.update({
      where: { id: invoiceId },
      data: { status: status2, paidAt: new Date() },
    });

    const finalInvoice = await db.feeInvoice.findUnique({ where: { id: invoiceId } });
    expect(finalInvoice!.status).toBe(InvoiceStatus.PAID);
    expect(finalInvoice!.paidAt).toBeDefined();
  });

  it("builds fee reminder message accurately in Pakistani format", () => {
    const msg = buildFeeReminderMessage("Usman Tariq", "2026-11", 300000);
    expect(msg).toBe(
      "Assalam-o-Alaikum, Usman Tariq ki 2026-11 ki fee PKR 3,000 baqi hai. Baraye meherbani jald ada karein. — EduFlow"
    );
  });
});
