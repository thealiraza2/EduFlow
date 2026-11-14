import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Marketing Landing Page — Phase 2: Features Bento, How it works, Photo-led sections", () => {
  test.beforeAll(async () => {
    const screenshotDir = path.join(process.cwd(), "tests", "e2e", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("Mobile Viewport (360px): Bento collapses to 1 col, photos stack above text, no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");

    // 1. Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 2. Verify Bento Grid collapses to 1 column
    const card1 = page.locator("text=Students & Fee Challans");
    const card2 = page.locator("text=10-Minute QR Attendance");
    await expect(card1).toBeVisible();
    await expect(card2).toBeVisible();

    const box1 = await card1.boundingBox();
    const box2 = await card2.boundingBox();
    expect(box1).not.toBeNull();
    expect(box2).not.toBeNull();
    if (box1 && box2) {
      // Card 2 must be vertically below Card 1 (1 column)
      expect(box2.y).toBeGreaterThan(box1.y);
    }

    // 3. Verify Photo-led sections: photo is always stacked ABOVE text on mobile
    // Story (a): teacher-attendance
    const imgA = page.locator('img[alt*="Teacher conducting class attendance"]');
    const titleA = page.locator("text=Attendance 30 second mein.");
    await expect(imgA).toBeVisible();
    await expect(titleA).toBeVisible();
    const boxImgA = await imgA.boundingBox();
    const boxTitleA = await titleA.boundingBox();
    if (boxImgA && boxTitleA) {
      expect(boxTitleA.y).toBeGreaterThan(boxImgA.y);
    }

    // Story (b): parent-phone
    const imgB = page.locator('img[alt*="Pakistani parent checking academy notifications"]');
    const titleB = page.locator("text=Parents ko WhatsApp par khabar.");
    await expect(imgB).toBeVisible();
    await expect(titleB).toBeVisible();
    const boxImgB = await imgB.boundingBox();
    const boxTitleB = await titleB.boundingBox();
    if (boxImgB && boxTitleB) {
      expect(boxTitleB.y).toBeGreaterThan(boxImgB.y);
    }

    // Story (c): principal-reports
    const imgC = page.locator('img[alt*="School principal desk with academic reports"]');
    const titleC = page.locator("text=Principal ko sab kuch ek screen par.");
    await expect(imgC).toBeVisible();
    await expect(titleC).toBeVisible();
    const boxImgC = await imgC.boundingBox();
    const boxTitleC = await titleC.boundingBox();
    if (boxImgC && boxTitleC) {
      expect(boxTitleC.y).toBeGreaterThan(boxImgC.y);
    }

    // 4. Capture 360px screenshot
    await page.screenshot({
      path: "tests/e2e/screenshots/phase2-360px.png",
      fullPage: false,
    });
  });

  test("Tablet Viewport (768px): Responsive grid, how it works steps, no horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/");

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // Verify How It Works 3 steps
    await expect(page.locator("text=Sign up — 14 din free")).toBeVisible();
    await expect(page.locator("text=Add students, teachers, classes")).toBeVisible();
    await expect(page.locator("text=Attendance, fees aur results — sab automatic")).toBeVisible();

    // Capture 768px screenshot
    await page.screenshot({
      path: "tests/e2e/screenshots/phase2-768px.png",
      fullPage: false,
    });
  });

  test("Desktop Viewport (1440px): Bento layout, mini scheme chips, alternating stories, honest WhatsApp note", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // Verify no horizontal overflow
    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);

    // 1. Verify Bento Grid Cards
    await expect(page.locator("text=Students & Fee Challans")).toBeVisible();
    await expect(page.locator("text=10-Minute QR Attendance")).toBeVisible();
    await expect(page.locator("text=Tests & Printable Result Cards")).toBeVisible();
    await expect(page.locator("text=Online Test Engine")).toBeVisible();
    await expect(page.locator("text=Board-Aware AI Paper Generator")).toBeVisible();
    await expect(page.locator("text=Deterministic Dropout Risk")).toBeVisible();

    // Verify Mini Scheme Chips in Big Card
    await expect(page.locator("text=12 MCQs (12 Marks)")).toBeVisible();
    await expect(page.locator("text=24 Short Qs (Select 15)")).toBeVisible();
    await expect(page.locator("text=3 Long Qs (Select 2)")).toBeVisible();
    await expect(page.locator("text=288 Official Schemes • PECTAA 2026–2027")).toBeVisible();

    // 2. Verify How it Works Section
    await expect(page.locator("text=Teen asaan steps mein shuru karein")).toBeVisible();
    await expect(page.getByText("01", { exact: true })).toBeVisible();
    await expect(page.getByText("02", { exact: true })).toBeVisible();
    await expect(page.getByText("03", { exact: true })).toBeVisible();

    // 3. Verify Alternating Photo Stories
    // Story A: Photo on left, text on right
    const imgA = page.locator('img[alt*="Teacher conducting class attendance"]');
    const titleA = page.locator("text=Attendance 30 second mein.");
    const boxImgA = await imgA.boundingBox();
    const boxTitleA = await titleA.boundingBox();
    if (boxImgA && boxTitleA) {
      expect(boxTitleA.x).toBeGreaterThan(boxImgA.x);
    }

    // Story B: Text on left, photo on right
    const imgB = page.locator('img[alt*="Pakistani parent checking academy notifications"]');
    const titleB = page.locator("text=Parents ko WhatsApp par khabar.");
    const boxImgB = await imgB.boundingBox();
    const boxTitleB = await titleB.boundingBox();
    if (boxImgB && boxTitleB) {
      expect(boxImgB.x).toBeGreaterThan(boxTitleB.x);
    }

    // Honest note on WhatsApp API
    await expect(page.locator("text=Honesty Note regarding WhatsApp Business")).toBeVisible();

    // Story C: Photo on left, text on right
    const imgC = page.locator('img[alt*="School principal desk with academic reports"]');
    const titleC = page.locator("text=Principal ko sab kuch ek screen par.");
    const boxImgC = await imgC.boundingBox();
    const boxTitleC = await titleC.boundingBox();
    if (boxImgC && boxTitleC) {
      expect(boxTitleC.x).toBeGreaterThan(boxImgC.x);
    }

    // Capture 1440px screenshot
    await page.screenshot({
      path: "tests/e2e/screenshots/phase2-1440px.png",
      fullPage: false,
    });
  });
});
