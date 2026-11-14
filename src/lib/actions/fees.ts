"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import {
  generateMonthlyInvoices,
  deriveInvoiceStatus,
  calculateRemainingBalance,
  buildFeeReminderMessage,
} from "@/lib/fees";
import { notifier } from "@/lib/notify";
import { PaymentMethod, InvoiceStatus, NotificationTrigger } from "@prisma/client";
import { revalidatePath } from "next/cache";

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amountMinor: z.number().int().positive("Payment amount must be a positive integer in paisa"),
  method: z.enum(["CASH", "JAZZCASH", "EASYPAISA", "BANK"]),
  receivedBy: z.string().optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

/**
 * Triggers monthly invoice generation for all active enrollments.
 * IDEMPOTENT: Re-running creates zero duplicates.
 */
export async function generateInvoicesAction(month: string) {
  await requireAdmin();
  const tenant = await requireTenant();

  if (!/^\d{4}-\d{2}$/.test(month)) {
    throw new Error("Invalid month format. Expected YYYY-MM");
  }

  const result = await generateMonthlyInvoices(month, new Date(), db, {
    academyId: tenant.academyId,
  });

  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/defaulters");

  return {
    success: true,
    ...result,
  };
}

/**
 * Records an append-only fee payment.
 * INVARIANT 2: Status is derived from sum of payments; never manually set.
 */
export async function recordPaymentAction(input: RecordPaymentInput) {
  const session = await auth();
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
    throw new Error("Unauthorized: Only administrators can collect fee payments.");
  }
  const tenant = await requireTenant();

  const validated = recordPaymentSchema.parse(input);
  const { invoiceId, amountMinor, method } = validated;

  const result = await db.$transaction(async (tx) => {
    // 1. Fetch invoice and existing payments
    const invoice = await tx.feeInvoice.findFirst({
      where: {
        id: invoiceId,
        academyId: tenant.academyId,
      },
      include: {
        payments: true,
        student: true,
      },
    });

    if (!invoice) {
      throw new Error("Invoice not found.");
    }

    const currentPaidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
    const remainingMinor = calculateRemainingBalance(invoice.totalMinor, currentPaidMinor);

    if (remainingMinor <= 0) {
      throw new Error("This invoice is already fully paid.");
    }

    if (amountMinor > remainingMinor) {
      throw new Error(
        `Payment amount exceeds remaining balance. Maximum payable is ${remainingMinor / 100} PKR.`
      );
    }

    // 2. Append-only payment insertion
    const payment = await tx.feePayment.create({
      data: {
        academyId: tenant.academyId,
        invoiceId,
        amountMinor,
        method: method as PaymentMethod,
        receivedBy: validated.receivedBy || session.user.name || session.user.email || "Admin Staff",
        paidAt: new Date(),
      },
    });

    // 3. Derive updated invoice status
    const newTotalPaidMinor = currentPaidMinor + amountMinor;
    const newStatus = deriveInvoiceStatus(invoice.totalMinor, newTotalPaidMinor);
    const paidAt = newStatus === InvoiceStatus.PAID ? new Date() : invoice.paidAt;

    await tx.feeInvoice.update({
      where: { id: invoiceId },
      data: {
        status: newStatus,
        paidAt,
      },
    });

    const newRemainingMinor = calculateRemainingBalance(invoice.totalMinor, newTotalPaidMinor);

    return {
      payment,
      newStatus,
      newTotalPaidMinor,
      newRemainingMinor,
    };
  });

  revalidatePath("/admin/fees");
  revalidatePath("/admin/fees/defaulters");
  revalidatePath(`/admin/students/${input.invoiceId}`);

  return {
    success: true,
    paymentId: result.payment.id,
    newStatus: result.newStatus,
    newTotalPaidMinor: result.newTotalPaidMinor,
    newRemainingMinor: result.newRemainingMinor,
  };
}

/**
 * Sends a one-tap fee reminder SMS to the student's guardian
 */
export async function sendFeeReminderAction(invoiceId: string) {
  await requireAdmin();
  const tenant = await requireTenant();

  const invoice = await db.feeInvoice.findFirst({
    where: {
      id: invoiceId,
      academyId: tenant.academyId,
    },
    include: {
      student: true,
      batch: true,
      payments: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found.");
  }

  const totalPaidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
  const remainingMinor = calculateRemainingBalance(invoice.totalMinor, totalPaidMinor);

  if (remainingMinor <= 0) {
    throw new Error("Cannot send reminder for a fully paid invoice.");
  }

  if (!invoice.student.guardianPhone) {
    throw new Error("No guardian phone number on file for this student.");
  }

  const message = buildFeeReminderMessage(
    invoice.student.name,
    invoice.month,
    remainingMinor
  );

  const notifyResult = await notifier.send({
    recipientPhone: invoice.student.guardianPhone,
    channel: "SMS",
    template: "FEE_REMINDER",
    trigger: NotificationTrigger.FEE_REMINDER,
    studentId: invoice.student.id,
    referenceId: `reminder_${invoice.id}_${Date.now()}`,
    message,
    academyId: tenant.academyId,
  });

  return {
    success: true,
    logId: notifyResult.messageId,
    recipientPhone: invoice.student.guardianPhone,
    message,
  };
}
