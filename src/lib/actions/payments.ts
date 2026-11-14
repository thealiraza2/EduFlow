"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getPaymentGateway, SupportedGateway } from "@/lib/payments";
import { calculateRemainingBalance } from "@/lib/fees";

const initiatePaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  gateway: z.enum(["JAZZCASH", "EASYPAISA"]),
});

export type InitiatePaymentInput = z.infer<typeof initiatePaymentSchema>;

/**
 * Initiates an online fee payment session from the Parent Portal.
 *
 * Invariant 5: Parent Isolation enforced — parents can ONLY initiate payments for their own children.
 */
export async function initiatePaymentAction(input: InitiatePaymentInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please sign in to initiate payment.");
  }

  const { invoiceId, gateway: gatewayName } = initiatePaymentSchema.parse(input);

  // 1. Fetch invoice with student and batch details
  const invoice = await db.feeInvoice.findUnique({
    where: { id: invoiceId },
    include: {
      student: true,
      batch: true,
      payments: true,
      academy: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  // 2. Parent Isolation Guard (Invariant 5)
  if (session.user.role === Role.PARENT) {
    if (invoice.student.guardianUserId !== session.user.id) {
      throw new Error("Access Denied: You cannot pay fees for another parent's child.");
    }
  }

  // 3. Status check: cannot pay an already paid invoice
  const currentPaidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remainingMinor = calculateRemainingBalance(invoice.totalMinor, currentPaidMinor);

  if (remainingMinor <= 0) {
    throw new Error("This invoice is already fully paid.");
  }

  // 4. Resolve payment gateway driver
  const gateway = getPaymentGateway(gatewayName);

  // 5. Create payment request
  const result = await gateway.createPayment({
    id: invoice.id,
    academyId: invoice.academyId,
    academyName: invoice.academy.name,
    studentId: invoice.studentId,
    studentName: invoice.student.name,
    studentAdmissionNo: invoice.student.admissionNo,
    batchName: invoice.batch.name,
    month: invoice.month,
    totalMinor: invoice.totalMinor,
    amountMinor: remainingMinor,
    guardianPhone: invoice.student.guardianPhone || undefined,
  });

  return {
    success: true,
    gateway: gatewayName,
    paymentUrl: result.paymentUrl,
    transactionId: result.transactionId,
    remainingMinor,
  };
}
