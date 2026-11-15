/**
 * AcademyHub - Easypaisa Payment Gateway Driver
 *
 * HONESTY NOTE:
 * Sandbox is 100% functional end-to-end for testing and integration.
 * However, LIVE production payments require an approved Easypaisa / Telenor Bank merchant account
 * (business registration certificate, corporate bank account, and merchant KYC verification).
 * Until merchant credentials are provisioned, the academy operates in sandbox mode
 * and manual payment collection mode (CASH / BANK). Never claim live payments
 * work without an approved merchant account.
 *
 * INVARIANT 11: Webhook callbacks verify cryptographic HMAC-SHA256 signature server-side.
 */

import crypto from "crypto";
import { InvoicePaymentRequest, PaymentCreationResult, CallbackVerificationResult } from "@/lib/payments";

export interface EasypaisaConfig {
  storeId: string;
  hashKey: string;
  returnUrl: string;
  sandboxUrl: string;
}

export const EASYPAISA_SANDBOX_DEFAULTS = {
  storeId: "12345",
  hashKey: "easypaisa_sandbox_hash_key_12345",
  returnUrl: "http://localhost:3000/api/webhooks/easypaisa",
  sandboxUrl: "http://localhost:3000/sandbox/checkout/easypaisa",
};

/**
 * Dedicated sandbox config provider. Never requires merchant env vars and never throws.
 */
export function getSandboxEasypaisaConfig(): EasypaisaConfig {
  return {
    storeId: process.env.EASYPAISA_SANDBOX_STORE_ID || process.env.EASYPAISA_STORE_ID || EASYPAISA_SANDBOX_DEFAULTS.storeId,
    hashKey: process.env.EASYPAISA_SANDBOX_HASH_KEY || process.env.EASYPAISA_HASH_KEY || EASYPAISA_SANDBOX_DEFAULTS.hashKey,
    returnUrl: process.env.EASYPAISA_RETURN_URL || EASYPAISA_SANDBOX_DEFAULTS.returnUrl,
    sandboxUrl: process.env.EASYPAISA_SANDBOX_URL || EASYPAISA_SANDBOX_DEFAULTS.sandboxUrl,
  };
}

/**
 * Returns Easypaisa configuration.
 * - In live mode (PAYMENT_MODE=live or isLive: true): enforces presence of merchant env vars
 *   AND verifies they differ from known sandbox defaults (Fix 6).
 * - Otherwise (sandbox mode): returns sandbox config without throwing.
 */
export function getEasypaisaConfig(options?: { isLive?: boolean }): EasypaisaConfig {
  const isLive = options?.isLive ?? (process.env.PAYMENT_MODE?.toLowerCase() === "live");

  if (isLive) {
    const storeId = process.env.EASYPAISA_STORE_ID?.trim();
    const hashKey = process.env.EASYPAISA_HASH_KEY?.trim();
    const returnUrl = process.env.EASYPAISA_RETURN_URL?.trim();
    const sandboxUrl = process.env.EASYPAISA_SANDBOX_URL?.trim() || "";

    if (!storeId || !hashKey || !returnUrl) {
      throw new Error(
        "Production Easypaisa configuration error: EASYPAISA_STORE_ID, EASYPAISA_HASH_KEY, and EASYPAISA_RETURN_URL must all be set for live payments."
      );
    }

    // Fix 6: Verify values differ from known sandbox defaults
    if (
      storeId === EASYPAISA_SANDBOX_DEFAULTS.storeId ||
      hashKey === EASYPAISA_SANDBOX_DEFAULTS.hashKey
    ) {
      throw new Error(
        "Production Easypaisa configuration error: Live gateway credentials must not match known sandbox default values."
      );
    }

    return { storeId, hashKey, returnUrl, sandboxUrl };
  }

  return getSandboxEasypaisaConfig();
}

/**
 * Calculates Easypaisa HMAC-SHA256 hash.
 * 1. Filter out signature/hash keys and empty/null/undefined values.
 * 2. Sort keys alphabetically.
 * 3. Concatenate key=value pairs joined with &: `k1=v1&k2=v2...`.
 * 4. Generate HMAC-SHA256 using hashKey as secret, output uppercase hex string.
 */
export function calculateEasypaisaHash(
  params: Record<string, any>,
  hashKey: string
): string {
  const sortedKeys = Object.keys(params)
    .filter(
      (k) =>
        k !== "signature" &&
        k !== "hash" &&
        params[k] !== undefined &&
        params[k] !== null &&
        params[k] !== ""
    )
    .sort();

  const pairs = sortedKeys.map((k) => `${k}=${String(params[k])}`);
  const stringToHash = pairs.join("&");

  return crypto
    .createHmac("sha256", hashKey)
    .update(stringToHash)
    .digest("hex")
    .toUpperCase();
}

/**
 * Easypaisa Gateway implementation
 */
export const easypaisaGateway = {
  name: "EASYPAISA" as const,

  /**
   * Prepares a payment request and returns checkout URL + transaction ID
   */
  async createPayment(invoice: InvoicePaymentRequest): Promise<PaymentCreationResult> {
    const config = getEasypaisaConfig();
    const transactionId = `EP${Date.now()}${Math.floor(100 + Math.random() * 900)}`;

    const formFields: Record<string, string> = {
      storeId: config.storeId,
      orderId: transactionId,
      transactionAmount: String(invoice.amountMinor), // Amount in paisa
      transactionType: "MA", // Mobile Account
      mobileAccountNo: invoice.guardianPhone || "",
      emailAddress: "",
      billReference: invoice.id,
      postBackURL: invoice.returnUrl || config.returnUrl,
    };

    // Calculate cryptographic HMAC-SHA256 signature
    formFields.signature = calculateEasypaisaHash(formFields, config.hashKey);

    // Build URL for the sandbox wallet checkout page
    const params = new URLSearchParams({
      gateway: "easypaisa",
      invoiceId: invoice.id,
      studentName: invoice.studentName,
      admissionNo: invoice.studentAdmissionNo,
      month: invoice.month,
      amountMinor: String(invoice.amountMinor),
      orderId: transactionId,
      returnUrl: formFields.postBackURL,
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
    const config = getEasypaisaConfig();
    const receivedHash = payload.signature || payload.hash;

    if (!receivedHash || typeof receivedHash !== "string") {
      return false;
    }

    const calculatedHash = calculateEasypaisaHash(payload, config.hashKey);

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
    const transactionId = String(payload.orderId || payload.transactionId || "");
    const invoiceId = String(payload.billReference || payload.invoiceId || "");
    const amountMinor = parseInt(String(payload.transactionAmount || payload.amountMinor || "0"), 10);
    const responseCode = String(payload.responseCode || payload.code || "");
    const responseMessage = String(payload.responseDesc || payload.message || "");

    // Easypaisa success code is "0000" or "PAID"
    const isSuccess =
      isValid &&
      (responseCode === "0000" ||
        responseCode === "000" ||
        responseCode === "PAID" ||
        responseCode === "SUCCESS");

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
