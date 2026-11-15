import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { TestStatus } from "@prisma/client";
import { getTestCredentials } from "../helpers/credentials";

test.describe("E2E Core Flow 2: Test → Marks → Publish → Parent Sees Result", () => {
  const ts = Date.now();
  const testTitle = `E2E Term Exam ${ts}`;
  let createdTestId: string | null = null;
  let testStudentId: string | null = null;

  test.afterAll(async () => {
    // Cleanup test records
    if (createdTestId) {
      await db.testResult.deleteMany({ where: { testId: createdTestId } });
      await db.test.deleteMany({ where: { id: createdTestId } });
    }
  });

  test("teacher creates test, enters marks, admin publishes, and parent sees published card", async ({ page }) => {
    // Hamza Tariq (AH-2026-0001) is linked to parent@academyhub.test
    const hamza = await db.student.findFirst({
      where: { admissionNo: "AH-2026-0001" },
    });
    expect(hamza).not.toBeNull();
    const { adminPassword, teacherPassword, parentPassword } = getTestCredentials();
    testStudentId = hamza!.id;

    // -------------------------------------------------------------------------
    // Step 1: Teacher Logs In & Creates Test
    // -------------------------------------------------------------------------
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "usman.teacher@academyhub.test");
    await page.fill('input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/teacher", { timeout: 15000 });

    await page.goto("/teacher/tests");
    await expect(page.getByRole("heading", { name: "Assessment Tests & Marks" })).toBeVisible();

    // Open Create Test Modal
    await page.click('button:has-text("Create New Test")');
    const modal = page.locator('div[role="dialog"]');
    await expect(modal).toBeVisible();
    await modal.locator('input[placeholder*="Maths"]').fill("Physics");
    await modal.locator('input[placeholder*="Chapter 1"]').fill(testTitle);
    await modal.locator('input[type="number"]').fill("100");
    await modal.locator('button[type="submit"]:has-text("Create Test")').click();

    // Dialog closes
    await expect(modal).toBeHidden({ timeout: 10000 });

    // Find test in DB
    const testRecord = await db.test.findFirst({
      where: { title: testTitle },
    });
    expect(testRecord).not.toBeNull();
    createdTestId = testRecord!.id;
    expect(testRecord!.status).toBe(TestStatus.DRAFT);

    // -------------------------------------------------------------------------
    // Step 2: Teacher Enters Marks
    // -------------------------------------------------------------------------
    await page.goto(`/teacher/tests?testId=${createdTestId}`);
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10000 });

    // Enter marks for all students in the roster (Hamza Tariq = 92, others = 75)
    const rows = page.locator("tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const row = rows.nth(i);
      const isHamza = await row.getByText("Hamza Tariq").isVisible().catch(() => false);
      const input = row.locator('input[type="number"]');
      if (isHamza) {
        await input.fill("92");
      } else {
        await input.fill("75");
      }
    }

    // Click submit marks
    await page.click('button:has-text("Submit Marks")');
    await expect(page.getByText(/Marks saved successfully/i)).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // Step 3: Admin Publishes the Test (Locks Marks)
    // -------------------------------------------------------------------------
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@academyhub.test");
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    await page.goto("/admin/results");
    await expect(page.getByRole("heading", { name: "Assessment Results & Publishing" })).toBeVisible();

    // Select the test from the dropdown
    await page.locator("select").first().selectOption(createdTestId);

    // Click Publish button
    await page.click('button:has-text("Publish Test Results")');
    await expect(page.getByText(/published successfully/i)).toBeVisible({ timeout: 10000 });

    // Verify test is now PUBLISHED in DB
    const publishedInDb = await db.test.findUnique({ where: { id: createdTestId } });
    expect(publishedInDb?.status).toBe(TestStatus.PUBLISHED);

    // -------------------------------------------------------------------------
    // Step 4: Parent Logs In and Sees Published Result
    // -------------------------------------------------------------------------
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "parent@academyhub.test");
    await page.fill('input[name="password"]', parentPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/parent", { timeout: 15000 });

    // Parent sees Hamza Tariq's child card
    await expect(page.getByRole("heading", { name: "Hamza Tariq" })).toBeVisible({ timeout: 10000 });

    // Check Results Tab
    await page.getByRole("button", { name: /Published Results/i }).first().click();
    await expect(page.getByText(testTitle)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Grade A+").first()).toBeVisible();
    await expect(page.getByText(/92\s*\/\s*100/).first()).toBeVisible();

    // -------------------------------------------------------------------------
    // Step 5: Official Result Card PDF Download
    // -------------------------------------------------------------------------
    const cardResponse = await page.request.get(
      `/api/tests/${createdTestId}/results/${testStudentId}/card`
    );
    expect(cardResponse.status()).toBe(200);
    expect(cardResponse.headers()["content-type"]).toContain("application/pdf");

    const pdfBuffer = await cardResponse.body();
    const pdfHeader = pdfBuffer.slice(0, 5).toString("ascii");
    expect(pdfHeader).toBe("%PDF-");
  });
});
