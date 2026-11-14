import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { getQRSecret, createQRToken, verifyQRToken } from "@/lib/qr";
import { POST as whatsappPostHandler, GET as whatsappGetHandler } from "@/app/api/webhooks/whatsapp/route";
import { NextRequest } from "next/server";
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginRateLimit,
  _clearRateLimits,
} from "@/lib/rate-limit";
import { changePasswordAction } from "@/lib/actions/auth";

describe("Security Hardening: Fix 1 - Fail-Closed WhatsApp Inbound Webhook", () => {
  const originalSecret = process.env.WHATSAPP_APP_SECRET;
  const originalToken = process.env.WHATSAPP_VERIFY_TOKEN;
  const testSecret = "test_meta_webhook_secret_987654";
  const testVerifyToken = "test_verify_token_12345";

  beforeEach(() => {
    process.env.WHATSAPP_APP_SECRET = testSecret;
    process.env.WHATSAPP_VERIFY_TOKEN = testVerifyToken;
  });

  afterEach(() => {
    process.env.WHATSAPP_APP_SECRET = originalSecret;
    process.env.WHATSAPP_VERIFY_TOKEN = originalToken;
  });

  it("POST without signature header returns 401 Unauthorized", async () => {
    const payload = JSON.stringify({ from: "03001234567", text: "fee" });
    const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
      method: "POST",
      body: payload,
    });

    const res = await whatsappPostHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("signature");
  });

  it("POST with wrong/forged signature returns 401 Unauthorized", async () => {
    const payload = JSON.stringify({ from: "03001234567", text: "fee" });
    const forgedSig = "sha256=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
      method: "POST",
      body: payload,
      headers: {
        "x-hub-signature-256": forgedSig,
      },
    });

    const res = await whatsappPostHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid webhook signature");
  });

  it("POST with missing WHATSAPP_APP_SECRET in env returns 401 Unauthorized", async () => {
    delete process.env.WHATSAPP_APP_SECRET;

    const payload = JSON.stringify({ from: "03001234567", text: "fee" });
    const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
      method: "POST",
      body: payload,
      headers: {
        "x-hub-signature-256": "sha256=dummy",
      },
    });

    const res = await whatsappPostHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("signature verification required but not configured");
  });

  it("POST with correct signature is processed successfully", async () => {
    const payload = JSON.stringify({
      object: "whatsapp_business_account",
      entry: [],
    });
    const hash = crypto.createHmac("sha256", testSecret).update(payload, "utf8").digest("hex");
    const validSig = `sha256=${hash}`;

    const req = new NextRequest("http://localhost:3000/api/webhooks/whatsapp", {
      method: "POST",
      body: payload,
      headers: {
        "x-hub-signature-256": validSig,
      },
    });

    const res = await whatsappPostHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("acknowledged");
  });

  it("GET without WHATSAPP_VERIFY_TOKEN fails closed with 403", async () => {
    delete process.env.WHATSAPP_VERIFY_TOKEN;
    const req = new NextRequest(
      "http://localhost:3000/api/webhooks/whatsapp?hub.mode=subscribe&hub.verify_token=any&hub.challenge=test_challenge"
    );

    const res = await whatsappGetHandler(req);
    expect(res.status).toBe(403);
  });
});

describe("Security Hardening: Fix 2 - Dedicated QR HMAC Secret", () => {
  const originalQRSecret = process.env.QR_HMAC_SECRET;
  const testSecret = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

  afterEach(() => {
    process.env.QR_HMAC_SECRET = originalQRSecret;
  });

  it("getQRSecret() throws when QR_HMAC_SECRET is unset", () => {
    delete process.env.QR_HMAC_SECRET;
    expect(() => getQRSecret()).toThrow("QR_HMAC_SECRET is not configured");
  });

  it("tokens minted with the wrong secret fail verification", () => {
    process.env.QR_HMAC_SECRET = testSecret;

    const { token } = createQRToken({
      batchId: "batch_test_123",
      academyId: "acad_test_123",
      date: "2026-11-20",
    });

    // Verification with valid secret passes
    const validResult = verifyQRToken(token);
    expect(validResult.valid).toBe(true);

    // Change secret to simulate tampered verification key
    process.env.QR_HMAC_SECRET = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
    const invalidResult = verifyQRToken(token);
    expect(invalidResult.valid).toBe(false);
    expect(invalidResult.error).toBe("INVALID_SIGNATURE");
  });
});

describe("Security Hardening: Fix 3 - mustChangePassword & Forced Rotation", () => {
  it("user model supports mustChangePassword flag and can be toggled", async () => {
    const testEmail = `pwd-test-${Date.now()}@academyhub.test`;
    const pwdHash = await bcrypt.hash("InitialPassword123!", 10);

    const user = await db.user.create({
      data: {
        email: testEmail,
        passwordHash: pwdHash,
        role: "ADMIN",
        name: "Password Rotation Test User",
        mustChangePassword: true,
      },
    });

    expect(user.mustChangePassword).toBe(true);

    // Simulate successful password rotation
    const newPwdHash = await bcrypt.hash("NewSecurePassword123!", 10);
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPwdHash,
        mustChangePassword: false,
      },
    });

    expect(updatedUser.mustChangePassword).toBe(false);

    // Verify new password works
    const isNewValid = await bcrypt.compare("NewSecurePassword123!", updatedUser.passwordHash);
    expect(isNewValid).toBe(true);

    // Clean up
    await db.user.delete({ where: { id: user.id } });
  });
});

describe("Security Hardening: Fix 4 - Brute-Force Login Rate Limiting", () => {
  const targetEmail = "attacker.target@academyhub.test";

  beforeEach(() => {
    _clearRateLimits();
  });

  it("5 failed logins -> 6th attempt rejected with account lock", () => {
    // 1-5 failed attempts
    for (let i = 1; i <= 5; i++) {
      const res = recordFailedLogin(targetEmail);
      if (i < 5) {
        expect(res.locked).toBe(false);
        expect(res.remainingAttempts).toBe(5 - i);
      } else {
        expect(res.locked).toBe(true);
        expect(res.remainingAttempts).toBe(0);
      }
    }

    // 6th attempt check
    const check = checkLoginRateLimit(targetEmail);
    expect(check.allowed).toBe(false);
    expect(check.remainingAttempts).toBe(0);
    expect(check.retryAfterMs).toBeGreaterThan(0);
  });

  it("lock expires after 15 minutes", () => {
    const startTime = Date.now();

    // Trigger 5 failed attempts
    for (let i = 0; i < 5; i++) {
      recordFailedLogin(targetEmail, startTime);
    }

    // Immediately locked
    expect(checkLoginRateLimit(targetEmail, startTime).allowed).toBe(false);

    // 14 minutes later: still locked
    const after14Mins = startTime + 14 * 60 * 1000;
    expect(checkLoginRateLimit(targetEmail, after14Mins).allowed).toBe(false);

    // 15 minutes + 1 second later: lockout expired
    const after15Mins = startTime + 15 * 60 * 1000 + 1000;
    const expiredCheck = checkLoginRateLimit(targetEmail, after15Mins);
    expect(expiredCheck.allowed).toBe(true);
    expect(expiredCheck.remainingAttempts).toBe(5);
  });

  it("successful login resets failed attempt count", () => {
    recordFailedLogin(targetEmail);
    recordFailedLogin(targetEmail);
    expect(checkLoginRateLimit(targetEmail).remainingAttempts).toBe(3);

    // Reset upon correct credentials
    resetLoginRateLimit(targetEmail);
    expect(checkLoginRateLimit(targetEmail).remainingAttempts).toBe(5);
  });
});

describe("Security Hardening: Fix 7 - Atomic Absence Notification Deduplication", () => {
  it("enforces UNIQUE(referenceId) at PostgreSQL engine level", async () => {
    const uniqueRef = `atomic_test_dedup_${Date.now()}`;
    const testAcademy = await db.academy.findFirst();

    // 1. Create first notification log record
    const first = await db.notificationLog.create({
      data: {
        academyId: testAcademy?.id || "seed-academy-id",
        recipientPhone: "03001234567",
        message: "First notification",
        referenceId: uniqueRef,
      },
    });
    expect(first.id).toBeDefined();

    // 2. Concurrent/duplicate insert with SAME referenceId must fail with unique constraint violation
    await expect(
      db.notificationLog.create({
        data: {
          academyId: testAcademy?.id || "seed-academy-id",
          recipientPhone: "03001234567",
          message: "Duplicate notification",
          referenceId: uniqueRef,
        },
      })
    ).rejects.toThrow();

    // Clean up
    await db.notificationLog.delete({ where: { id: first.id } });
  });
});
