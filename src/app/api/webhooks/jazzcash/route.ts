import { NextRequest, NextResponse } from "next/server";
import { jazzCashGateway } from "@/lib/payments/jazzcash";
import { processGatewayCallback } from "@/lib/payments";

/**
 * JazzCash Webhook & Return URL Endpoint
 * Handles server-to-server IPN callbacks and browser postback redirects.
 *
 * Invariant 11: Cryptographic HMAC-SHA256 signature is verified server-side.
 * Idempotency: duplicate webhook calls for same pp_TxnRefNo create zero duplicate records.
 */
export async function POST(req: NextRequest) {
  try {
    let payload: Record<string, any> = {};

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      const text = await req.text();
      try {
        payload = JSON.parse(text);
      } catch {
        const params = new URLSearchParams(text);
        params.forEach((value, key) => {
          payload[key] = value;
        });
      }
    }

    console.log("[JAZZCASH WEBHOOK RECEIVED]", {
      txnRefNo: payload.pp_TxnRefNo,
      billRef: payload.pp_BillReference,
      responseCode: payload.pp_ResponseCode,
      amount: payload.pp_Amount,
    });

    const result = await processGatewayCallback(jazzCashGateway, payload);

    // Check if the request is from a browser form post (accept header contains text/html)
    const acceptHeader = req.headers.get("accept") || "";
    const isBrowserNavigation = acceptHeader.includes("text/html");

    if (isBrowserNavigation) {
      const url = new URL("/parent", req.nextUrl.origin);
      if (result.success) {
        url.searchParams.set("payment", "success");
        if (result.invoiceId) url.searchParams.set("invoiceId", result.invoiceId);
        if (result.duplicate) url.searchParams.set("status", "already_processed");
      } else {
        url.searchParams.set("payment", "failed");
        url.searchParams.set("error", result.error || "payment_rejected");
      }
      return NextResponse.redirect(url, 303);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Payment verification failed" },
        { status: result.error?.includes("signature") ? 400 : 422 }
      );
    }

    return NextResponse.json({
      success: true,
      duplicate: result.duplicate,
      paymentId: result.paymentId,
      invoiceId: result.invoiceId,
      newStatus: result.newStatus,
      message: result.message,
    });
  } catch (error: any) {
    console.error("[JAZZCASH WEBHOOK UNCAUGHT ERROR]", error);
    return NextResponse.json(
      { error: "Internal server error processing payment callback" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Support GET redirect callbacks from sandbox or gateway
  const searchParams = req.nextUrl.searchParams;
  const payload: Record<string, any> = {};
  searchParams.forEach((val, key) => {
    payload[key] = val;
  });

  const result = await processGatewayCallback(jazzCashGateway, payload);

  const url = new URL("/parent", req.nextUrl.origin);
  if (result.success) {
    url.searchParams.set("payment", "success");
    if (result.invoiceId) url.searchParams.set("invoiceId", result.invoiceId);
  } else {
    url.searchParams.set("payment", "failed");
    url.searchParams.set("error", result.error || "payment_failed");
  }
  return NextResponse.redirect(url, 303);
}
