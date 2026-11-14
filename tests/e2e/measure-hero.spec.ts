import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("Hero Verification - Phase 1", () => {
  test("Desktop 1440px - verify visibility, overlap <= 30%, buttons above fold", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const getStartedBtn = await page.locator('section a[href="/signup"]').first().boundingBox();
    const learnMoreBtn = await page.locator('section a[href="#features"]').first().boundingBox();
    const studentImg = await page.locator('img[alt="Smiling schoolgirl in uniform holding books in bright classroom"]').boundingBox();
    const dashboard = await page.locator('text=EduFlow Academy Portal').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first().boundingBox();

    console.log("=== DESKTOP 1440px METRICS ===");
    console.log("Viewport: 1440x900");
    console.log("Get Started button bottom Y:", getStartedBtn!.y + getStartedBtn!.height);
    console.log("Learn More button bottom Y:", learnMoreBtn!.y + learnMoreBtn!.height);
    console.log("Student Image Box:", studentImg);
    console.log("Dashboard Mockup Box:", dashboard);

    // Verify buttons are above fold (visible without scrolling)
    expect(getStartedBtn!.y + getStartedBtn!.height).toBeLessThanOrEqual(900);
    expect(learnMoreBtn!.y + learnMoreBtn!.height).toBeLessThanOrEqual(900);

    // Verify dashboard overlaps photo by <= 30%
    const overlapHeight = (studentImg!.y + studentImg!.height) - dashboard!.y;
    const overlapPercent = (overlapHeight / studentImg!.height) * 100;
    console.log(`Overlap: ${overlapHeight.toFixed(1)}px (${overlapPercent.toFixed(1)}% of photo height)`);
    
    // Dashboard must overlap, but never more than 30% of photo
    expect(overlapHeight).toBeGreaterThan(0);
    expect(overlapPercent).toBeLessThanOrEqual(30);

    // Screenshots
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/eduflow-hero-viewport-1440px.png"),
    });
    const heroEl = page.locator("section").first();
    await heroEl.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/eduflow-hero-section-1440px.png"),
    });
  });

  test("Mobile 360px - verify visibility, overlap <= 30%, buttons above fold", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const getStartedBtn = await page.locator('section a[href="/signup"]').first().boundingBox();
    const learnMoreBtn = await page.locator('section a[href="#features"]').first().boundingBox();
    const studentImg = await page.locator('img[alt="Smiling schoolgirl in uniform holding books in bright classroom"]').boundingBox();
    const dashboard = await page.locator('text=EduFlow Academy Portal').locator('xpath=ancestor::div[contains(@class, "rounded-2xl")]').first().boundingBox();

    console.log("=== MOBILE 360px METRICS ===");
    console.log("Viewport: 360x800");
    console.log("Get Started button bottom Y:", getStartedBtn!.y + getStartedBtn!.height);
    console.log("Learn More button bottom Y:", learnMoreBtn!.y + learnMoreBtn!.height);
    console.log("Student Image Box:", studentImg);
    console.log("Dashboard Mockup Box:", dashboard);

    // Verify buttons are above fold (visible without scrolling)
    expect(getStartedBtn!.y + getStartedBtn!.height).toBeLessThanOrEqual(800);
    expect(learnMoreBtn!.y + learnMoreBtn!.height).toBeLessThanOrEqual(800);

    // Verify dashboard overlaps photo by <= 30%
    const overlapHeight = (studentImg!.y + studentImg!.height) - dashboard!.y;
    const overlapPercent = (overlapHeight / studentImg!.height) * 100;
    console.log(`Overlap: ${overlapHeight.toFixed(1)}px (${overlapPercent.toFixed(1)}% of photo height)`);

    expect(overlapHeight).toBeGreaterThan(0);
    expect(overlapPercent).toBeLessThanOrEqual(30);

    // Screenshots
    await page.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/eduflow-hero-viewport-360px.png"),
    });
    const heroEl = page.locator("section").first();
    await heroEl.screenshot({
      path: path.join(process.cwd(), "tests/e2e/screenshots/eduflow-hero-section-360px.png"),
    });
  });
});
