/**
 * AcademyHub - Fee Calculation Module
 * Single source of truth for fee computation, fine calculations, and invoice balances.
 * INVARIANT: All amounts are stored and calculated in integer minor units (paisa).
 */

import { addPaisa, assertIntegerPaisa, Paisa, subtractPaisa } from "./money";

export interface FeeBreakdown {
  monthlyFeeMinor: Paisa;
  admissionFeeMinor: Paisa;
  lateFineMinor: Paisa;
  discountMinor: Paisa;
  totalMinor: Paisa;
}

/**
 * Calculates late fee fine based on due day and payment date.
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

  const dueDate = new Date(year, month, dueDayOfMonth, 23, 59, 59, 999);

  return currentDate > dueDate ? lateFineMinor : 0;
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
