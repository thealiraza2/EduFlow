import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  jazzCashGateway,
  calculateJazzCashHash,
  getJazzCashConfig,
} from "@/lib/payments/jazzcash";
import {
  easypaisaGateway,
  calculateEasypaisaHash,
  getEasypaisaConfig,
} from "@/lib/payments/easypaisa";
import {
  processGatewayCallback,
  getPaymentGateway,
} from "@/lib/payments";
import { InvoiceStatus, PaymentMethod } from "@prisma/client";

describe("Phase 11: Real Payments (JazzCash + Easypaisa Sandbox)", () => {
  let testAcademyId = "seed-academy-id";
  let testClassId: string;
  let testBatchId: string;
  let testStudentId: string;
  let testInvoiceId: string;
  const testMonth = "2026-11";
  const feeAmountMinor = 500000; // PKR 5,000

  beforeAll(async () => {
    // 1. Create a test class, batch, student, and invoice
    const cls = await db.class.create({
      data: {
        academyId: testAcademyId,
        name: "Test-Payments-Class",
        section: "P",
        capacity: 40,
      },
    });
    testClassId = cls.id;

    const batch = await db.batch.create({
      data: {
        academyId: testAcademyId,
        classId: testClassId,
        name: "Matric Science",
        timing: "3-5 PM",
        feeMinor: feeAmountMinor,
        feePlan: {
          create: {
            academyId: testAcademyId,
            monthlyFeeMinor: feeAmountMinor,
            admissionFeeMinor: 0,
            lateFineMinor: 0,
            dueDayOfMonth: 10,
          },
        },
      },
    });
    testBatchId = batch.id;

    const student = await db.student.create({
      data: {
        academyId: testAcademyId,
        admissionNo: `TEST-PAY-${Date.now()}`,
        name: "Ahmed Raza",
        guardianName: "Raza Ali",
        guardianPhone: "03009998877",
      },
    });
    testStudentId = student.id;

    const invoice = await db.feeInvoice.create({
      data: {
        academyId: testAcademyId,
        studentId: testStudentId,
        batchId: testBatchId,
        month: testMonth,
        amountMinor: feeAmountMinor,
        discountMinor: 0,
        fineMinor: 0,
        totalMinor: feeAmountMinor,
        status: InvoiceStatus.UNPAID,
      },
    });
    testInvoiceId = invoice.id;
  });

  afterAll(async () => {
    // Clean up test records
    await db.feePayment.deleteMany({
      where: { invoiceId: testInvoiceId },
    });
    await db.feeInvoice.deleteMany({
      where: { id: testInvoiceId },
    });
    await db.student.deleteMany({
      where: { id: testStudentId },
    });
    await db.batch.deleteMany({
      where: { id: testBatchId },
    });
    await db.class.deleteMany({
      where: { id: testClassId },
    });
  });

  describe("1. Invariant 11: Cryptographic Signature Verification", () => {
    it("JazzCash: valid HMAC-SHA256 signature passes verification", () => {
      const config = getJazzCashConfig();
      const payload: Record<string, string> = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: "JC_TEST_1001",
        pp_Amount: "500000",
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: "20261114120000",
        pp_BillReference: testInvoiceId,
        pp_Description: "Fee Payment",
        pp_ResponseCode: "000",
        pp_ResponseMessage: "Transaction Approved",
      };

      // Calculate genuine hash
      payload.pp_SecureHash = calculateJazzCashHash(payload, config.integritySalt);

      const isValid = jazzCashGateway.verifyCallback(payload);
      expect(isValid).toBe(true);
    });

    it("JazzCash: tampered amount fails verification", () => {
      const config = getJazzCashConfig();
      const payload: Record<string, string> = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: "JC_TEST_1002",
        pp_Amount: "500000",
        pp_TxnCurrency: "PKR",
        pp_TxnDateTime: "20261114120000",
        pp_BillReference: testInvoiceId,
        pp_Description: "Fee Payment",
        pp_ResponseCode: "000",
        pp_ResponseMessage: "Transaction Approved",
      };

      // Compute hash for 500000
      payload.pp_SecureHash = calculateJazzCashHash(payload, config.integritySalt);

      // Tamper amount to 100 paisa (1 PKR)
      payload.pp_Amount = "100";

      const isValid = jazzCashGateway.verifyCallback(payload);
      expect(isValid).toBe(false);
    });

    it("JazzCash: tampered transaction ID or missing hash fails verification", () => {
      const config = getJazzCashConfig();
      const payload: Record<string, string> = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: "JC_TEST_1003",
        pp_Amount: "500000",
        pp_ResponseCode: "000",
      };

      payload.pp_SecureHash = calculateJazzCashHash(payload, config.integritySalt);

      // Tamper transaction reference
      payload.pp_TxnRefNo = "JC_TEST_FORGED_9999";
      expect(jazzCashGateway.verifyCallback(payload)).toBe(false);

      // Missing hash
      delete (payload as any).pp_SecureHash;
      expect(jazzCashGateway.verifyCallback(payload)).toBe(false);
    });

    it("Easypaisa: valid HMAC-SHA256 signature passes verification", () => {
      const config = getEasypaisaConfig();
      const payload: Record<string, string> = {
        storeId: config.storeId,
        orderId: "EP_TEST_2001",
        transactionAmount: "500000",
        billReference: testInvoiceId,
        responseCode: "0000",
        responseDesc: "SUCCESS",
      };

      payload.signature = calculateEasypaisaHash(payload, config.hashKey);

      const isValid = easypaisaGateway.verifyCallback(payload);
      expect(isValid).toBe(true);
    });

    it("Easypaisa: tampered payload fails verification", () => {
      const config = getEasypaisaConfig();
      const payload: Record<string, string> = {
        storeId: config.storeId,
        orderId: "EP_TEST_2002",
        transactionAmount: "500000",
        billReference: testInvoiceId,
        responseCode: "0000",
        responseDesc: "SUCCESS",
      };

      payload.signature = calculateEasypaisaHash(payload, config.hashKey);

      // Tamper amount
      payload.transactionAmount = "10000";
      expect(easypaisaGateway.verifyCallback(payload)).toBe(false);

      // Corrupted signature
      payload.signature = "INVALID_TAMPERED_HASH";
      expect(easypaisaGateway.verifyCallback(payload)).toBe(false);
    });
  });

  describe("2. Webhook Processing & Automated Status Derivation", () => {
    it("rejects untrusted/tampered callback without creating any payment", async () => {
      const config = getJazzCashConfig();
      const tamperedPayload = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: `JC_ATTACK_${Date.now()}`,
        pp_Amount: "500000",
        pp_BillReference: testInvoiceId,
        pp_ResponseCode: "000",
        pp_SecureHash: "FORGED_SIGNATURE_VALUE_12345",
      };

      const result = await processGatewayCallback(jazzCashGateway, tamperedPayload);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/signature|tamper/i);

      // Verify zero payments were created
      const payments = await db.feePayment.findMany({
        where: { invoiceId: testInvoiceId },
      });
      expect(payments.length).toBe(0);
    });

    it("processes valid payment: records FeePayment and auto-marks invoice PAID", async () => {
      const config = getJazzCashConfig();
      const txnRefNo = `JC_VALID_${Date.now()}`;
      const payload: Record<string, string> = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: String(feeAmountMinor),
        pp_BillReference: testInvoiceId,
        pp_ResponseCode: "000",
        pp_ResponseMessage: "Approved",
      };

      payload.pp_SecureHash = calculateJazzCashHash(payload, config.integritySalt);

      const result = await processGatewayCallback(jazzCashGateway, payload);
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(false);
      expect(result.newStatus).toBe(InvoiceStatus.PAID);
      expect(result.newRemainingMinor).toBe(0);

      // Verify in DB
      const invoice = await db.feeInvoice.findUnique({
        where: { id: testInvoiceId },
        include: { payments: true },
      });
      expect(invoice?.status).toBe(InvoiceStatus.PAID);
      expect(invoice?.paidAt).not.toBeNull();
      expect(invoice?.payments.length).toBe(1);
      expect(invoice?.payments[0].gatewayTransactionId).toBe(txnRefNo);
      expect(invoice?.payments[0].method).toBe(PaymentMethod.JAZZCASH);
      expect(invoice?.payments[0].amountMinor).toBe(feeAmountMinor);
    });
  });

  describe("3. Idempotency Guard (FeePayment.gatewayTransactionId UNIQUE)", () => {
    it("duplicate webhook with SAME transaction ID creates ZERO duplicate rows", async () => {
      const config = getJazzCashConfig();
      // Fetch the payment created in the previous test
      const initialPayments = await db.feePayment.findMany({
        where: { invoiceId: testInvoiceId },
      });
      expect(initialPayments.length).toBe(1);
      const originalPayment = initialPayments[0];
      const txnRefNo = originalPayment.gatewayTransactionId!;

      // Formulate duplicate webhook with the same txnRefNo
      const duplicatePayload: Record<string, string> = {
        pp_MerchantID: config.merchantId,
        pp_Password: config.password,
        pp_TxnRefNo: txnRefNo,
        pp_Amount: String(feeAmountMinor),
        pp_BillReference: testInvoiceId,
        pp_ResponseCode: "000",
        pp_ResponseMessage: "Approved",
      };
      duplicatePayload.pp_SecureHash = calculateJazzCashHash(duplicatePayload, config.integritySalt);

      // Execute duplicate callback
      const result = await processGatewayCallback(jazzCashGateway, duplicatePayload);
      expect(result.success).toBe(true);
      expect(result.duplicate).toBe(true);
      expect(result.paymentId).toBe(originalPayment.id);

      // Database verification: still exactly 1 FeePayment record
      const afterPayments = await db.feePayment.findMany({
        where: { invoiceId: testInvoiceId },
      });
      expect(afterPayments.length).toBe(1);
      expect(afterPayments[0].id).toBe(originalPayment.id);
    });

    it("PostgreSQL unique constraint rejects duplicate gatewayTransactionId insertion", async () => {
      const existing = await db.feePayment.findFirst({
        where: { invoiceId: testInvoiceId },
      });
      expect(existing?.gatewayTransactionId).toBeDefined();

      await expect(
        db.feePayment.create({
          data: {
            academyId: testAcademyId,
            invoiceId: testInvoiceId,
            amountMinor: 50000,
            method: PaymentMethod.JAZZCASH,
            receivedBy: "Attacker Script",
            gatewayTransactionId: existing!.gatewayTransactionId!,
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("4. Easypaisa Payment & Partial Payments", () => {
    let partialInvoiceId: string;

    beforeAll(async () => {
      const inv = await db.feeInvoice.create({
        data: {
          academyId: testAcademyId,
          studentId: testStudentId,
          batchId: testBatchId,
          month: "2026-12",
          amountMinor: 600000, // PKR 6,000
          discountMinor: 0,
          fineMinor: 0,
          totalMinor: 600000,
          status: InvoiceStatus.UNPAID,
        },
      });
      partialInvoiceId = inv.id;
    });

    afterAll(async () => {
      await db.feePayment.deleteMany({
        where: { invoiceId: partialInvoiceId },
      });
      await db.feeInvoice.deleteMany({
        where: { id: partialInvoiceId },
      });
    });

    it("partial payment marks invoice PARTIAL", async () => {
      const config = getEasypaisaConfig();
      const orderId = `EP_PARTIAL_${Date.now()}`;
      const payload: Record<string, string> = {
        storeId: config.storeId,
        orderId,
        transactionAmount: "250000", // PKR 2,500 of 6,000
        billReference: partialInvoiceId,
        responseCode: "0000",
        responseDesc: "SUCCESS",
      };

      payload.signature = calculateEasypaisaHash(payload, config.hashKey);

      const result = await processGatewayCallback(easypaisaGateway, payload);
      expect(result.success).toBe(true);
      expect(result.newStatus).toBe(InvoiceStatus.PARTIAL);
      expect(result.newRemainingMinor).toBe(350000); // 6000 - 2500 = 3500

      const invoice = await db.feeInvoice.findUnique({
        where: { id: partialInvoiceId },
        include: { payments: true },
      });
      expect(invoice?.status).toBe(InvoiceStatus.PARTIAL);
      expect(invoice?.payments.length).toBe(1);
      expect(invoice?.payments[0].method).toBe(PaymentMethod.EASYPAISA);
      expect(invoice?.payments[0].amountMinor).toBe(250000);
    });

    it("manual payment coexists cleanly alongside gateway payments", async () => {
      // Admin collects remaining 350,000 via CASH
      const invoice = await db.feeInvoice.findUnique({
        where: { id: partialInvoiceId },
        include: { payments: true },
      });

      const currentPaid = invoice!.payments.reduce((s, p) => s + p.amountMinor, 0);
      const remaining = invoice!.totalMinor - currentPaid;

      // Append-only CASH payment
      const manualPayment = await db.feePayment.create({
        data: {
          academyId: testAcademyId,
          invoiceId: partialInvoiceId,
          amountMinor: remaining,
          method: PaymentMethod.CASH,
          receivedBy: "Admin Staff",
          gatewayTransactionId: null, // Manual payments have null gatewayTransactionId
        },
      });

      // Update invoice status
      await db.feeInvoice.update({
        where: { id: partialInvoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: new Date(),
        },
      });

      const updated = await db.feeInvoice.findUnique({
        where: { id: partialInvoiceId },
        include: { payments: true },
      });

      expect(updated?.status).toBe(InvoiceStatus.PAID);
      expect(updated?.payments.length).toBe(2);

      // First payment was Easypaisa Gateway
      expect(updated?.payments[0].method).toBe(PaymentMethod.EASYPAISA);
      expect(updated?.payments[0].gatewayTransactionId).not.toBeNull();

      // Second payment was Cash Manual
      expect(updated?.payments[1].method).toBe(PaymentMethod.CASH);
      expect(updated?.payments[1].gatewayTransactionId).toBeNull();
      expect(updated?.payments[1].receivedBy).toBe("Admin Staff");
    });
  });
});
