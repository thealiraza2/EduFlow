/**
 * AcademyHub - JazzCash Payment Gateway Driver
 *
 * HONESTY NOTE:
 * Sandbox is 100% functional end-to-end for testing and integration.
 * However, LIVE production payments require an approved JazzCash merchant account
 * (business registration docs, merchant agreement, corporate NTN & bank account).
 * Until merchant credentials are submitted, the academy operates in sandbox mode
 * and manual payment collection mode (CASH / BANK). Never claim live payments
 * work without an approved merchant account.
 *
 * INVARIANT 11: Webhook callbacks verify cryptographic HMAC-SHA256 signature server-side.
 */

import crypto from "crypto";
import { InvoicePaymentRequest, PaymentCreationResult, CallbackVerificationResult } from "@/lib/payments";

export interface JazzCashConfig {
  merchantId: string;
  password: string;
  integritySalt: string;
  returnUrl: string;
  sandboxUrl: string;
}

export function getJazzCashConfig(): JazzCashConfig {
  const merchantId = process.env.JAZZCASH_MERCHANT_ID || "MC12345_SANDBOX";
  const password = process.env.JAZZCASH_PASSWORD || "sandbox_password_123";
  const integritySalt = process.env.JAZZCASH_INTEGRITY_SALT || "sandbox_salt_secret_9876543210";
  const returnUrl = process.env.JAZZCASH_RETURN_URL || "http://localhost:3000/api/webhooks/jazzcash";
  const sandboxUrl = process.env.JAZZCASH_SANDBOX_URL || "http://localhost:3000/sandbox/checkout/jazzcash";

  return {
    merchantId,
    password,
    integritySalt,
    returnUrl,
    sandboxUrl,
  };
}

/**
 * Calculates JazzCash HMAC-SHA256 hash according to JazzCash HTTP POST specification.
 * 1. Filter out `pp_SecureHash` and empty/null/undefined values.
 * 2. Sort keys alphabetically.
 * 3. Concatenate non-empty values prefixed by integrity salt: `${salt}&${val1}&${val2}...`.
 * 4. Generate HMAC-SHA256 using integrity salt as key, output uppercase hex string.
 */
export function calculateJazzCashHash(
  params: Record<string, any>,
  integritySalt: string
): string {
  const sortedKeys = Object.keys(params)
    .filter(
      (k) =>
        k !== "pp_SecureHash" &&
        params[k] !== undefined &&
        params[k] !== null &&
        params[k] !== ""
    )
    .sort();

  const sortedValues = sortedKeys.map((k) => String(params[k]));
  const stringToHash = `${integritySalt}&${sortedValues.join("&")}`;

  return crypto
    .createHmac("sha256", integritySalt)
    .update(stringToHash)
    .digest("hex")
    .toUpperCase();
}

/**
 * JazzCash Gateway implementation
 */
export const jazzCashGateway = {
  name: "JAZZCASH" as const,

  /**
   * Prepares a payment request and returns checkout URL + transaction ID
   */
  async createPayment(invoice: InvoicePaymentRequest): Promise<PaymentCreationResult> {
    const config = getJazzCashConfig();
    const transactionId = `JC${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
    const now = new Date();
    const txnDateTime =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    // JazzCash expects amount in paisa (e.g. 500000 for 5000.00 PKR)
    const pp_Amount = String(invoice.amountMinor);

    const formFields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: config.merchantId,
      pp_Password: config.password,
      pp_TxnRefNo: transactionId,
      pp_Amount,
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: invoice.id,
      pp_Description: `Fee Payment for ${invoice.studentName} (${invoice.month})`,
      pp_ReturnURL: invoice.returnUrl || config.returnUrl,
    };

    // Calculate cryptographic HMAC-SHA256 signature
    formFields.pp_SecureHash = calculateJazzCashHash(formFields, config.integritySalt);

    // Build URL for the sandbox wallet checkout page
    const params = new URLSearchParams({
      gateway: "jazzcash",
      invoiceId: invoice.id,
      studentName: invoice.studentName,
      admissionNo: invoice.studentAdmissionNo,
      month: invoice.month,
      amountMinor: pp_Amount,
      txnRefNo: transactionId,
      returnUrl: formFields.pp_ReturnURL,
    });

    const paymentUrl = `${config.sandboxUrl}?${params.toString()}`;

    return {
      paymentUrl,
      transactionId,
      formFields,
    };
  },

  /**
   * Verifies incoming callback cryptographic HMAC-SHA256 signature (Invariant 11)
   */
  verifyCallback(payload: Record<string, any>): boolean {
    const config = getJazzCashConfig();
    const receivedHash = payload.pp_SecureHash;

    if (!receivedHash || typeof receivedHash !== "string") {
      return false;
    }

    const calculatedHash = calculateJazzCashHash(payload, config.integritySalt);

    try {
      const receivedBuffer = Buffer.from(receivedHash.toUpperCase(), "utf8");
      const calculatedBuffer = Buffer.from(calculatedHash, "utf8");

      if (receivedBuffer.length !== calculatedBuffer.length) {
        return false;
      }

      return crypto.timingSafeEqual(receivedBuffer, calculatedBuffer);
    } catch {
      return false;
    }
  },

  /**
   * Parses callback payload into standardized transaction result
   */
  parseCallback(payload: Record<string, any>): CallbackVerificationResult {
    const isValid = this.verifyCallback(payload);
    const transactionId = String(payload.pp_TxnRefNo || payload.transactionId || "");
    const invoiceId = String(payload.pp_BillReference || payload.invoiceId || "");
    const amountMinor = parseInt(String(payload.pp_Amount || "0"), 10);
    const responseCode = String(payload.pp_ResponseCode || "");
    const responseMessage = String(payload.pp_ResponseMessage || "");

    // JazzCash success code is "000" or "121"
    const isSuccess = isValid && (responseCode === "000" || responseCode === "121" || responseCode === "SUCCESS");

    return {
      isValid,
      transactionId,
      invoiceId,
      amountMinor,
      status: isSuccess ? "PAID" : "FAILED",
      responseCode,
      responseMessage,
      rawPayload: payload,
      error: !isValid ? "Cryptographic signature verification failed" : undefined,
    };
  },
};
