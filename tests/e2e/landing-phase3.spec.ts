import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

test.describe("Marketing Landing Page — Phase 3: Pricing, FAQ, Final CTA, Photo Strip", () => {
  test.beforeAll(async () => {
    const screenshotDir = path.join(process.cwd(), "tests", "e2e", "screenshots");
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test("Pricing Toggle switches prices correctly (both Monthly and Annual states) & CTAs work", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // 1. Check Default Monthly State
    await expect(page.getByText("PKR 2,500")).toBeVisible();
    await expect(page.getByText("PKR 5,000")).toBeVisible();
    await expect(page.getByText("PKR 9,000")).toBeVisible();
    await expect(page.locator("text=/ month").first()).toBeVisible();

    // Verify Growth has Most Popular badge
    await expect(page.locator("text=Most Popular")).toBeVisible();

    // 2. Click Annual Toggle
    const toggleBtn = page.locator('button[role="switch"]');
    await toggleBtn.click();

    // Verify Annual State Prices
    await expect(page.getByText("PKR 25,000")).toBeVisible();
    await expect(page.getByText("PKR 50,000")).toBeVisible();
    await expect(page.getByText("PKR 90,000")).toBeVisible();
    await expect(page.locator("text=/ year").first()).toBeVisible();
    await expect(page.locator("text=Pay 10 months, get 12").first()).toBeVisible();

    // 3. Switch back to Monthly
    await toggleBtn.click();
    await expect(page.getByText("PKR 2,500")).toBeVisible();
    await expect(page.getByText("PKR 5,000")).toBeVisible();
    await expect(page.getByText("PKR 9,000")).toBeVisible();

    // 4. Pricing CTA smooth-scrolls to #trial
    const starterTrialCta = page.locator('#pricing a:has-text("Start 14-Day Free Trial")').first();
    await starterTrialCta.click();
  });

  test("FAQ Accordion opens/closes, single item open at a time, keyboard accessible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    // 1. Initial State: First question is open by default
    const q1Btn = page.locator('button:has-text("14-day free trial ke baad kya hota hai?")');
    await expect(q1Btn).toHaveAttribute("aria-expanded", "true");
    const a1Text = page.locator("text=Trial khatam hone par aapka data mukammal mehfooz rehta hai.");
    await expect(a1Text).toBeVisible();

    // 2. Click Question 2 -> Question 2 opens, Question 1 closes
    const q2Btn = page.locator('button:has-text("Kya hamara data safe aur private hai?")');
    await q2Btn.click();
    await expect(q2Btn).toHaveAttribute("aria-expanded", "true");
    await expect(q1Btn).toHaveAttribute("aria-expanded", "false");

    const a2Text = page.locator("text=Har academy ka data alag database tenant mein isolated hota hai");
    await expect(a2Text).toBeVisible();

    // 3. Keyboard accessibility: Focus question 3 and hit Enter
    const q3Btn = page.locator('button:has-text("Kya WhatsApp ka kharcha alag se dena hoga?")');
    await q3Btn.focus();
    await page.keyboard.press("Enter");
    await expect(q3Btn).toHaveAttribute("aria-expanded", "true");
    await expect(q2Btn).toHaveAttribute("aria-expanded", "false");
  });

  test("Final CTA, No Testimonials invariant, Photo Strip & Screenshots (360px, 768px, 1440px)", async ({
    page,
  }) => {
    // 1. Verify Final CTA
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");

    const finalCtaHeading = page.locator("text=Apni academy ko aaj hi digital karo.");
    await expect(finalCtaHeading).toBeVisible();
    await expect(page.locator('section:has-text("Apni academy ko aaj hi digital karo.")')).toHaveClass(/bg-pine/);

    // 2. Verify Wide Photo Strip
    const stripImg = page.locator('img[alt*="School children and students studying in classroom"]');
    await expect(stripImg).toBeVisible();
    await expect(
      page.locator("text=Dedicated to empowering teachers, students, and academies across Pakistan.")
    ).toBeVisible();

    // 3. Anti-AI / Honesty Invariant: ZERO testimonials in DOM
    const testimonialKeywords = ["testimonial", "what our clients say", "trusted by 10,000", "reviews"];
    for (const kw of testimonialKeywords) {
      const match = await page.locator(`text=${kw}`).count();
      expect(match).toBe(0);
    }

    // Capture 1440px screenshot
    await page.screenshot({
      path: "tests/e2e/screenshots/phase3-1440px.png",
      fullPage: false,
    });

    // 4. Tablet Viewport (768px)
    await page.setViewportSize({ width: 768, height: 1024 });
    const tabletOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(tabletOverflow).toBe(false);
    await page.screenshot({
      path: "tests/e2e/screenshots/phase3-768px.png",
      fullPage: false,
    });

    // 5. Mobile Viewport (360px)
    await page.setViewportSize({ width: 360, height: 800 });
    const mobileOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(mobileOverflow).toBe(false);
    await page.screenshot({
      path: "tests/e2e/screenshots/phase3-360px.png",
      fullPage: false,
    });
  });
});
