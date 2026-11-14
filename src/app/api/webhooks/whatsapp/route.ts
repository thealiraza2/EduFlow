import { NextRequest, NextResponse } from "next/server";
import { processInboundWhatsAppMessage, verifyMetaSignature } from "@/lib/whatsapp-bot";

/**
 * GET Handler: Meta Webhook URL Verification Challenge
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN?.trim();

  // Fail-closed: Never fall back to public default tokens
  if (!verifyToken) {
    console.error("[WHATSAPP WEBHOOK] WHATSAPP_VERIFY_TOKEN is not configured. Rejecting challenge.");
    return new Response("Forbidden", { status: 403 });
  }

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[WHATSAPP WEBHOOK] Challenge verification successful.");
    return new Response(challenge || "ok", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }

  console.warn("[WHATSAPP WEBHOOK] Challenge verification failed - invalid token or mode.", {
    mode,
    tokenProvided: !!token,
  });
  return new Response("Forbidden", { status: 403 });
}

/**
 * POST Handler: Inbound WhatsApp Messages & Status Updates
 * Must fail closed: requires valid WHATSAPP_APP_SECRET and valid X-Hub-Signature-256 HMAC
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const appSecret = process.env.WHATSAPP_APP_SECRET?.trim();

    // 1. Fail-closed: WHATSAPP_APP_SECRET is mandatory for any inbound processing
    if (!appSecret) {
      console.error("[WHATSAPP SECURITY ALERT] WHATSAPP_APP_SECRET is not configured. Webhook rejected.");
      return NextResponse.json(
        { error: "Webhook signature verification required but not configured" },
        { status: 401 }
      );
    }

    // 2. Signature header is mandatory on every POST
    const signatureHeader = req.headers.get("x-hub-signature-256");
    if (!signatureHeader) {
      console.warn("[WHATSAPP SECURITY ALERT] Missing X-Hub-Signature-256 header. Webhook rejected.");
      return NextResponse.json(
        { error: "Missing webhook signature" },
        { status: 401 }
      );
    }

    // 3. Cryptographic HMAC-SHA256 signature verification
    const isValid = verifyMetaSignature(rawBody, signatureHeader, appSecret);
    if (!isValid) {
      console.warn("[WHATSAPP SECURITY ALERT] Invalid webhook signature detected.", {
        signatureHeader,
      });
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      );
    }

    let payload: any = {};
    if (rawBody.trim()) {
      payload = JSON.parse(rawBody);
    }

    // 4. Process authenticated Meta WhatsApp Cloud API payload
    const entry = payload.entry?.[0];
    const change = entry?.changes?.[0]?.value;

    const messageObj = change?.messages?.[0];
    if (messageObj) {
      const from = messageObj.from;
      let text = "";

      if (messageObj.type === "text") {
        text = messageObj.text?.body || "";
      } else if (messageObj.type === "interactive") {
        text =
          messageObj.interactive?.button_reply?.title ||
          messageObj.interactive?.list_reply?.title ||
          "";
      }

      if (from && text) {
        const result = await processInboundWhatsAppMessage({ from, text });
        return NextResponse.json({ status: "ok", result }, { status: 200 });
      }
    }

    // 5. Signed direct payload format (supported for HMAC-authenticated clients / test harnesses)
    if (payload.from && (payload.text || payload.message)) {
      const from = String(payload.from);
      const text = String(payload.text || payload.message);
      const result = await processInboundWhatsAppMessage({ from, text });
      return NextResponse.json({ status: "ok", result }, { status: 200 });
    }

    // For delivery receipts or status pings, acknowledge with 200 OK
    return NextResponse.json({ status: "acknowledged" }, { status: 200 });
  } catch (err: any) {
    console.error("[WHATSAPP WEBHOOK ERROR]", err);
    return NextResponse.json(
      { error: "Webhook processing error", details: err.message },
      { status: 500 }
    );
  }
}
