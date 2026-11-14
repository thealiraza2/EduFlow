import { db } from "@/lib/db";
import { beforeAll } from "vitest";

// Fallback environment variables for self-contained testing on unseeded environments
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/academyhub?schema=public";
process.env.AUTH_SECRET =
  process.env.AUTH_SECRET || "test_auth_secret_min_32_characters_long_123";
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET;
process.env.QR_HMAC_SECRET =
  process.env.QR_HMAC_SECRET || "test_qr_hmac_secret_key_1234567890abcdef";

beforeAll(async () => {
  try {
    // Ensure default test academy exists for self-contained test execution
    const existing = await db.academy.findUnique({
      where: { id: "seed-academy-id" },
    });
    if (!existing) {
      await db.academy.create({
        data: {
          id: "seed-academy-id",
          name: "Test Academy Campus",
          slug: "main",
          subdomain: "main",
          plan: "PRO",
          status: "ACTIVE",
        },
      });
    }
  } catch (err) {
    // If DB is not ready during non-DB unit tests, continue gracefully
  }
});
