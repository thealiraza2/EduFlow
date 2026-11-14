import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import fs from "fs";
import path from "path";

test.describe("Marketing Landing Page — Phase 4: Trial Signup, Contact, Legal, Full Verification", () => {
  test.beforeAll(async () => {
    const screenshotDir = path.join(process.cwd(), "tests", "e2e", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("1. 14-Day Trial Signup Form End-to-End (Fill -> Submit -> DB Tenant Created -> Login Flow)", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const timestamp = Date.now();
    const testEmail = `principal.${timestamp}@academyhub.test`;
    const testAcademy = `Iqbal Model Academy ${timestamp}`;

    // 1. Locate and fill Trial Signup Form
    const trialSection = page.locator("#trial");
    await expect(trialSection).toBeVisible();

    await page.fill('#trial input[name="name"]', "Professor Ahmad Raza");
    await page.fill('#trial input[name="academyName"]', testAcademy);
    await page.fill('#trial input[name="phone"]', "03001234567");
    await page.fill('#trial input[name="email"]', testEmail);
    await page.fill('#trial input[name="password"]', "AdminTrial123!");

    // 2. Submit Form
    const submitBtn = page.locator('#trial button[type="submit"]');
    await submitBtn.click();

    // Check for any potential error message
    const errorAlert = page.locator('#trial div.bg-red-50');
    if (await errorAlert.isVisible().catch(() => false)) {
      const errText = await errorAlert.innerText();
      console.error("Signup form error:", errText);
    }

    // 3. Verify Success Screen
    const successHeading = page.locator("text=Trial ban gaya — login karein!");
    await expect(successHeading).toBeVisible({ timeout: 15000 });
    await expect(page.locator(`text=${testEmail}`)).toBeVisible();

    // 4. Verify Database Records directly
    const createdUser = await db.user.findUnique({
      where: { email: testEmail },
      include: { academy: true },
    });
    expect(createdUser).not.toBeNull();
    expect(createdUser?.role).toBe("ADMIN");
    expect(createdUser?.academy?.name).toBe(testAcademy);
    expect(createdUser?.academy?.plan).toBe("PRO");
    expect(createdUser?.academy?.status).toBe("ACTIVE");

    // 5. Click Login button and verify redirect
    const loginLink = page.locator('a:has-text("Login Karein")');
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await page.waitForURL(/\/login/);
    expect(page.url()).toContain("login");
    // Verify email is in query or field
    expect(page.url()).toContain(encodeURIComponent(testEmail));
  });

  test("2. Contact Form End-to-End (Fill -> Submit -> Saved to DB -> Rate Limit)", async ({
    page,
    request,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const contactSection = page.locator("#contact");
    await expect(contactSection).toBeVisible();

    const timestamp = Date.now();
    const contactPhone = `0321${Math.floor(1000000 + Math.random() * 9000000)}`;

    // 1. Fill and submit contact form via UI
    await page.fill('#contact input[name="name"]', "Chaudhry Kashif");
    await page.fill('#contact input[name="contact"]', contactPhone);
    await page.fill(
      '#contact textarea[name="message"]',
      "Hum Gujranwala mein 250 students ki coaching academy chalatay hain. Please demo arrange karein."
    );

    const sendBtn = page.locator('#contact button[type="submit"]');
    await sendBtn.click();

    // 2. Verify Success Notice in UI
    await expect(
      page.locator("text=Shukriya! Aapka message mil gaya hai. Hamari team jald rabta karegi.")
    ).toBeVisible({ timeout: 10000 });

    // 3. Verify Database Row Created in PostgreSQL
    const submission = await db.contactSubmission.findFirst({
      where: { contact: contactPhone },
    });
    expect(submission).not.toBeNull();
    expect(submission?.name).toBe("Chaudhry Kashif");
    expect(submission?.message).toContain("Gujranwala");

    // 4. Verify API Route Direct Validation & Rate Limiting (5 per hour)
    // Make 4 more requests to reach limit of 5
    for (let i = 0; i < 4; i++) {
      await request.post("/api/contact", {
        data: {
          name: `Tester ${i}`,
          contact: `test${i}@mail.com`,
          message: `This is rate limit testing message number ${i}`,
        },
      });
    }

    // 6th request from same IP must receive HTTP 429
    const rateLimitedRes = await request.post("/api/contact", {
      data: {
        name: "Blocked Attacker",
        contact: "blocked@mail.com",
        message: "This should be rejected by rate limiter.",
      },
    });
    expect(rateLimitedRes.status()).toBe(429);
    const body = await rateLimitedRes.json();
    expect(body.error).toContain("Too many submissions");
  });

  test("3. Legal Pages Navigation (/privacy & /terms) and Footer Links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // 1. Check Privacy Policy Page
    const privacyLink = page.locator('footer a:has-text("Privacy Policy")');
    await privacyLink.click();
    await page.waitForURL(/\/privacy/);
    await expect(page.locator("h1")).toContainText("Privacy Policy");
    await expect(page.locator("text=Strict Tenant Isolation")).toBeVisible();

    // Click back to home
    await page.locator('text=Back to AcademyHub').click();
    await page.waitForURL(/\/$/);

    // 2. Check Terms of Service Page
    const termsLink = page.locator('footer a:has-text("Terms of Service")');
    await termsLink.click();
    await page.waitForURL(/\/terms/);
    await expect(page.locator("h1")).toContainText("Terms of Service");
    await expect(page.getByRole("heading", { name: "1. 14-Day Free Trial" })).toBeVisible();
  });

  test("4. Full Responsive Screenshots (360px, 768px, 1024px, 1440px) & Zero Horizontal Overflow", async ({
    page,
  }) => {
    const viewports = [
      { name: "360px", width: 360, height: 800 },
      { name: "768px", width: 768, height: 1024 },
      { name: "1024px", width: 1024, height: 900 },
      { name: "1440px", width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto("/");

      // Assert zero horizontal overflow
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });
      expect(hasOverflow).toBe(false);

      // Save screenshot
      await page.screenshot({
        path: `tests/e2e/screenshots/phase4-${vp.name}.png`,
        fullPage: false,
      });
    }
  });
});
