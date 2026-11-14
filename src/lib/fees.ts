/**
 * AcademyHub - Fee Calculation Module
 * Single source of truth for fee computation, fine calculations, invoice generation,
 * status derivation, and reminder notifications.
 *
 * INVARIANT 1: All amounts are stored and calculated in integer minor units (paisa).
 * INVARIANT 2: Fee payments are append-only. Invoice status is derived, never set by hand.
 */

import { db } from "@/lib/db";
import { addPaisa, assertIntegerPaisa, formatPKR, Paisa, subtractPaisa } from "./money";
import { InvoiceStatus, Prisma } from "@prisma/client";

export interface FeeBreakdown {
  monthlyFeeMinor: Paisa;
  admissionFeeMinor: Paisa;
  lateFineMinor: Paisa;
  discountMinor: Paisa;
  totalMinor: Paisa;
}

/**
 * Calculates late fee fine based on due day and target/current date.
 */
export function calculateLateFine(
  dueDayOfMonth: number,
  invoiceMonth: string, // YYYY-MM
  lateFineMinor: Paisa,
  currentDate: Date = new Date()
): Paisa {
  assertIntegerPaisa(lateFineMinor);
  if (lateFineMinor <= 0) return 0;

  const [yearStr, monthStr] = invoiceMonth.split("-");
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Due date is at 23:59:59 of the dueDayOfMonth
  const dueDate = new Date(year, month, dueDayOfMonth, 23, 59, 59, 999);

  return currentDate.getTime() > dueDate.getTime() ? lateFineMinor : 0;
}

/**
 * Calculates the total invoice amount in minor units (paisa).
 * Total = (Monthly + Admission + LateFine) - Discount
 */
export function calculateInvoiceTotal(
  monthlyFeeMinor: Paisa,
  admissionFeeMinor: Paisa,
  lateFineMinor: Paisa,
  discountMinor: Paisa
): FeeBreakdown {
  assertIntegerPaisa(monthlyFeeMinor);
  assertIntegerPaisa(admissionFeeMinor);
  assertIntegerPaisa(lateFineMinor);
  assertIntegerPaisa(discountMinor);

  const subtotal = addPaisa(addPaisa(monthlyFeeMinor, admissionFeeMinor), lateFineMinor);
  const total = Math.max(0, subtractPaisa(subtotal, discountMinor));

  return {
    monthlyFeeMinor,
    admissionFeeMinor,
    lateFineMinor,
    discountMinor,
    totalMinor: total,
  };
}

/**
 * Calculates remaining balance on an invoice given total paid so far.
 */
export function calculateRemainingBalance(totalMinor: Paisa, paidMinor: Paisa): Paisa {
  assertIntegerPaisa(totalMinor);
  assertIntegerPaisa(paidMinor);
  return Math.max(0, subtractPaisa(totalMinor, paidMinor));
}

/**
 * Derives invoice status from total payable and total paid.
 * INVARIANT 2: Never store or hand-edit status directly.
 * total paid >= total → PAID
 * total paid > 0 → PARTIAL
 * else → UNPAID
 */
export function deriveInvoiceStatus(
  totalMinor: Paisa,
  totalPaidMinor: Paisa
): InvoiceStatus {
  assertIntegerPaisa(totalMinor);
  assertIntegerPaisa(totalPaidMinor);

  if (totalMinor === 0) {
    return InvoiceStatus.PAID;
  }
  if (totalPaidMinor >= totalMinor) {
    return InvoiceStatus.PAID;
  }
  if (totalPaidMinor > 0) {
    return InvoiceStatus.PARTIAL;
  }
  return InvoiceStatus.UNPAID;
}

/**
 * Generates monthly invoices for all active enrollments.
 * IDEMPOTENT: Running generation twice for the same month creates ZERO duplicates.
 * UNIQUE(studentId, batchId, month) is enforced in both application logic and database index.
 */
export async function generateMonthlyInvoices(
  month: string, // YYYY-MM
  currentDate: Date = new Date(),
  client: Prisma.TransactionClient | typeof db = db,
  filter?: { batchId?: string; studentId?: string }
) {
  // Validate month format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid month format. Expected YYYY-MM (e.g. 2026-11)");
  }

  // Base enrollment where clause
  const whereClause: Prisma.EnrollmentWhereInput = {
    status: "ACTIVE",
    student: { status: "ACTIVE" },
  };

  if (filter?.batchId) {
    whereClause.batchId = filter.batchId;
  }
  if (filter?.studentId) {
    whereClause.studentId = filter.studentId;
  }

  // Fetch all active enrollments of active students
  const activeEnrollments = await client.enrollment.findMany({
    where: whereClause,
    include: {
      student: true,
      batch: {
        include: {
          feePlan: true,
        },
      },
    },
  });

  let createdCount = 0;
  let skippedCount = 0;
  const createdInvoiceIds: string[] = [];

  for (const enrollment of activeEnrollments) {
    const studentId = enrollment.studentId;
    const batchId = enrollment.batchId;
    const feePlan = enrollment.batch.feePlan;

    // 1. Check if invoice already exists (Idempotent guard)
    const existing = await client.feeInvoice.findUnique({
      where: {
        studentId_batchId_month: {
          studentId,
          batchId,
          month,
        },
      },
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // 2. Compute fee components
    const monthlyFeeMinor = feePlan?.monthlyFeeMinor ?? enrollment.batch.feeMinor;
    const dueDayOfMonth = feePlan?.dueDayOfMonth ?? 10;
    const planLateFineMinor = feePlan?.lateFineMinor ?? 0;

    const fineMinor = calculateLateFine(dueDayOfMonth, month, planLateFineMinor, currentDate);
    const discountMinor = 0; // Default zero discount

    const breakdown = calculateInvoiceTotal(
      monthlyFeeMinor,
      0, // admission fee handled upon admission
      fineMinor,
      discountMinor
    );

    // 3. Create FeeInvoice
    const invoice = await client.feeInvoice.create({
      data: {
        studentId,
        batchId,
        month,
        amountMinor: breakdown.monthlyFeeMinor,
        discountMinor: breakdown.discountMinor,
        fineMinor: breakdown.lateFineMinor,
        totalMinor: breakdown.totalMinor,
        status: InvoiceStatus.UNPAID,
      },
    });

    createdCount++;
    createdInvoiceIds.push(invoice.id);
  }

  return {
    month,
    totalActive: activeEnrollments.length,
    createdCount,
    skippedCount,
    createdInvoiceIds,
  };
}

/**
 * Builds the fee reminder message for Pakistan academy guardians
 */
export function buildFeeReminderMessage(
  studentName: string,
  month: string,
  balanceMinor: Paisa
): string {
  const formattedBalance = formatPKR(balanceMinor);
  return `Assalam-o-Alaikum, ${studentName} ki ${month} ki fee ${formattedBalance} baqi hai. Baraye meherbani jald ada karein. — AcademyHub`;
}
