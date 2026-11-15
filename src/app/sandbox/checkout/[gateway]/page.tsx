import React from "react";
import { notFound } from "next/navigation";
import { getSandboxJazzCashConfig, calculateJazzCashHash } from "@/lib/payments/jazzcash";
import { getSandboxEasypaisaConfig, calculateEasypaisaHash } from "@/lib/payments/easypaisa";
import { SandboxWalletCheckout } from "@/components/sandbox/SandboxWalletCheckout";

interface PageProps {
  params: Promise<{
    gateway: string;
  }>;
  searchParams: Promise<{
    invoiceId?: string;
    studentName?: string;
    admissionNo?: string;
    month?: string;
    amountMinor?: string;
    txnRefNo?: string;
    orderId?: string;
    returnUrl?: string;
  }>;
}

export default async function SandboxCheckoutPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;

  const rawGateway = resolvedParams.gateway?.toLowerCase();
  if (rawGateway !== "jazzcash" && rawGateway !== "easypaisa") {
    notFound();
  }

  const gateway = rawGateway as "jazzcash" | "easypaisa";
  const invoiceId = resolvedSearch.invoiceId || "inv_sample_123";
  const studentName = resolvedSearch.studentName || "Demo Student";
  const admissionNo = resolvedSearch.admissionNo || "AH-2026-0001";
  const month = resolvedSearch.month || "2026-11";
  const amountMinor = parseInt(resolvedSearch.amountMinor || "500000", 10);
  const transactionId =
    resolvedSearch.txnRefNo ||
    resolvedSearch.orderId ||
    `${gateway === "jazzcash" ? "JC" : "EP"}${Date.now()}`;

  let validPayload: Record<string, string> = {};
  let tamperedPayload: Record<string, string> = {};
  let webhookUrl = `/api/webhooks/${gateway}`;

  if (gateway === "jazzcash") {
    const config = getSandboxJazzCashConfig();
    const now = new Date();
    const txnDateTime =
      now.getFullYear().toString() +
      String(now.getMonth() + 1).padStart(2, "0") +
      String(now.getDate()).padStart(2, "0") +
      String(now.getHours()).padStart(2, "0") +
      String(now.getMinutes()).padStart(2, "0") +
      String(now.getSeconds()).padStart(2, "0");

    validPayload = {
      pp_MerchantID: config.merchantId,
      pp_Password: config.password,
      pp_TxnRefNo: transactionId,
      pp_Amount: String(amountMinor),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: txnDateTime,
      pp_BillReference: invoiceId,
      pp_Description: `Academy fee payment for ${month}`,
      pp_ResponseCode: "000",
      pp_ResponseMessage: "Transaction Approved",
    };

    validPayload.pp_SecureHash = calculateJazzCashHash(validPayload, config.integritySalt);

    // Tampered payload: alters amount without updating signature
    tamperedPayload = {
      ...validPayload,
      pp_Amount: "100", // Tampered amount (1 PKR instead of genuine fee)
    };
  } else {
    const config = getSandboxEasypaisaConfig();
    validPayload = {
      storeId: config.storeId,
      orderId: transactionId,
      transactionAmount: String(amountMinor),
      billReference: invoiceId,
      responseCode: "0000",
      responseDesc: "SUCCESS",
    };

    validPayload.signature = calculateEasypaisaHash(validPayload, config.hashKey);

    // Tampered payload: invalid hash
    tamperedPayload = {
      ...validPayload,
      signature: "CORRUPTED_OR_TAMPERED_HASH_1234567890",
    };
  }

  return (
    <SandboxWalletCheckout
      gateway={gateway}
      invoiceId={invoiceId}
      studentName={studentName}
      admissionNo={admissionNo}
      month={month}
      amountMinor={amountMinor}
      transactionId={transactionId}
      validPayload={validPayload}
      tamperedPayload={tamperedPayload}
      webhookUrl={webhookUrl}
    />
  );
}
