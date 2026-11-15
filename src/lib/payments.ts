/**
 * EduFlow - Payment Gateway Interface & Reconciliation Engine
 *
 * HONESTY NOTE:
 * Sandbox is fully functional end-to-end with cryptographic HMAC-SHA256 signature
 * verification, idempotent webhook reconciliation, and automated invoice status updates.
 * However, LIVE payments need a JazzCash / Easypaisa merchant account (business registration
 * docs + corporate bank account). Until then, the system runs in sandbox and manual mode.
 * Never claim live payments work without an approved merchant account.
 *
 * INVARIANT 11: Webhook callbacks verify cryptographic signature/hash server-side.
 * INVARIANT 2: Fee payments are append-only. FeeInvoice.status is derived, never set by hand.
 */

import { db } from "@/lib/db";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";
import { deriveInvoiceStatus, calculateRemainingBalance } from "@/lib/fees";
import { jazzCashGateway } from "@/lib/payments/jazzcash";
import { easypaisaGateway } from "@/lib/payments/easypaisa";

export interface InvoicePaymentRequest {
  id: string;
  academyId: string;
  academyName?: string;
  studentId: string;
  studentName: string;
  studentAdmissionNo: string;
  batchName: string;
  month: string;
  totalMinor: number;
  amountMinor: number; // In minor units (paisa)
  guardianPhone?: string;
  returnUrl?: string;
}

export interface PaymentCreationResult {
  paymentUrl: string;
  transactionId: string;
  formFields?: Record<string, string>;
}

export interface CallbackVerificationResult {
  isValid: boolean;
  transactionId: string;
  invoiceId: string;
  amountMinor: number;
  status: "PAID" | "FAILED";
  responseCode?: string;
  responseMessage?: string;
  rawPayload?: Record<string, any>;
  error?: string;
}

export interface PaymentGateway {
  readonly name: "JAZZCASH" | "EASYPAISA";
  createPayment(invoice: InvoicePaymentRequest): Promise<PaymentCreationResult>;
  verifyCallback(payload: Record<string, any>): boolean;
  parseCallback(payload: Record<string, any>): CallbackVerificationResult;
}

export type SupportedGateway = "JAZZCASH" | "EASYPAISA";

/**
 * Returns payment gateway driver for requested method
 */
export function getPaymentGateway(method: SupportedGateway | string): PaymentGateway {
  const normalized = method.toUpperCase();
  if (normalized === "JAZZCASH") {
    return jazzCashGateway;
  }
  if (normalized === "EASYPAISA") {
    return easypaisaGateway;
  }
  throw new Error(`Unsupported payment gateway: ${method}`);
}

export interface GatewayProcessResult {
  success: boolean;
  duplicate: boolean;
  paymentId?: string;
  invoiceId?: string;
  newStatus?: InvoiceStatus;
  newTotalPaidMinor?: number;
  newRemainingMinor?: number;
  message?: string;
  error?: string;
}

/**
 * Server-side payment webhook processing engine.
 *
 * 1. Verifies cryptographic signature server-side (Invariant 11).
 * 2. Enforces idempotency via UNIQUE FeePayment.gatewayTransactionId:
 *    A duplicate webhook with the same transactionId records NOTHING twice.
 * 3. Appends FeePayment and derives new invoice status (Invariant 2).
 * 4. Gracefully logs failures and never crashes.
 */
export async function processGatewayCallback(
  gateway: PaymentGateway,
  payload: Record<string, any>
): Promise<GatewayProcessResult> {
  try {
    // 1. Invariant 11: Cryptographic signature/hash verification
    const isValid = gateway.verifyCallback(payload);
    if (!isValid) {
      console.warn(
        `[PAYMENT SECURITY ALERT] Invariant 11 failed: Invalid ${gateway.name} callback signature! Potential tampering.`,
        { payload }
      );
      return {
        success: false,
        duplicate: false,
        error: "Invalid cryptographic signature or tampered payload.",
      };
    }

    // 2. Parse payload into normalized format
    const parsed = gateway.parseCallback(payload);
    if (parsed.status !== "PAID") {
      console.log(
        `[PAYMENT STATUS] ${gateway.name} callback received non-success status: ${parsed.responseCode} (${parsed.responseMessage}) for invoice ${parsed.invoiceId}`
      );
      return {
        success: false,
        duplicate: false,
        error: `Payment failed at gateway: ${parsed.responseMessage || parsed.responseCode}`,
      };
    }

    if (!parsed.transactionId) {
      return {
        success: false,
        duplicate: false,
        error: "Missing transaction reference in gateway callback.",
      };
    }

    // 3. Idempotency Check: FeePayment.gatewayTransactionId UNIQUE
    const existingPayment = await db.feePayment.findUnique({
      where: { gatewayTransactionId: parsed.transactionId },
      include: { invoice: true },
    });

    if (existingPayment) {
      console.log(
        `[PAYMENT IDEMPOTENCY] Transaction ID "${parsed.transactionId}" already processed for invoice ${existingPayment.invoiceId}. Zero duplicate records created.`
      );
      return {
        success: true,
        duplicate: true,
        paymentId: existingPayment.id,
        invoiceId: existingPayment.invoiceId,
        newStatus: existingPayment.invoice.status,
        message: "Payment was already recorded successfully (idempotent duplicate webhook).",
      };
    }

    // 4. Fetch target invoice
    const invoice = await db.feeInvoice.findUnique({
      where: { id: parsed.invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      console.error(
        `[PAYMENT ERROR] Target invoice ${parsed.invoiceId} not found for transaction ${parsed.transactionId}.`
      );
      return {
        success: false,
        duplicate: false,
        error: `Invoice ${parsed.invoiceId} not found in database.`,
      };
    }

    // Calculate balances
    const currentPaidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
    const remainingMinor = calculateRemainingBalance(invoice.totalMinor, currentPaidMinor);

    if (remainingMinor <= 0) {
      console.log(
        `[PAYMENT NOTICE] Invoice ${invoice.id} is already fully paid. Marking payment as zero or credit.`
      );
    }

    const paymentAmountMinor = parsed.amountMinor > 0 ? parsed.amountMinor : remainingMinor;

    // 5. Atomic transaction to record payment and derive status
    const result = await db.$transaction(async (tx) => {
      // Create append-only payment
      const payment = await tx.feePayment.create({
        data: {
          academyId: invoice.academyId,
          invoiceId: invoice.id,
          amountMinor: paymentAmountMinor,
          method: gateway.name as PaymentMethod,
          receivedBy: `${gateway.name === "JAZZCASH" ? "JazzCash" : "Easypaisa"} Gateway (Sandbox)`,
          gatewayTransactionId: parsed.transactionId,
          rawGatewayPayload: JSON.stringify(payload),
          paidAt: new Date(),
        },
      });

      // Derive new status
      const newTotalPaidMinor = currentPaidMinor + paymentAmountMinor;
      const newStatus = deriveInvoiceStatus(invoice.totalMinor, newTotalPaidMinor);
      const paidAt = newStatus === InvoiceStatus.PAID ? new Date() : invoice.paidAt;

      const updatedInvoice = await tx.feeInvoice.update({
        where: { id: invoice.id },
        data: {
          status: newStatus,
          paidAt,
        },
      });

      const newRemaining = calculateRemainingBalance(invoice.totalMinor, newTotalPaidMinor);

      return {
        payment,
        updatedInvoice,
        newTotalPaidMinor,
        newRemainingMinor: newRemaining,
      };
    });

    console.log(
      `[PAYMENT SUCCESS] Invoice ${invoice.id} received ${(paymentAmountMinor / 100).toFixed(2)} PKR via ${gateway.name} (Txn: ${parsed.transactionId}). New Status: ${result.updatedInvoice.status}.`
    );

    return {
      success: true,
      duplicate: false,
      paymentId: result.payment.id,
      invoiceId: invoice.id,
      newStatus: result.updatedInvoice.status,
      newTotalPaidMinor: result.newTotalPaidMinor,
      newRemainingMinor: result.newRemainingMinor,
      message: "Payment processed and invoice updated successfully.",
    };
  } catch (error: any) {
    // Check for PostgreSQL unique constraint violation on gatewayTransactionId
    if (error?.code === "P2002" && error?.meta?.target?.includes("gatewayTransactionId")) {
      console.log(
        `[PAYMENT CONCURRENCY IDEMPOTENCY] Concurrent duplicate transaction detected by PostgreSQL unique constraint. Skipping.`
      );
      return {
        success: true,
        duplicate: true,
        message: "Payment was concurrently recorded (database unique constraint enforced).",
      };
    }

    // Callback failures are logged, never crash
    console.error(`[PAYMENT WEBHOOK EXCEPTION] Error processing ${gateway.name} callback:`, error);
    return {
      success: false,
      duplicate: false,
      error: error.message || "Internal payment processing error",
    };
  }
}
