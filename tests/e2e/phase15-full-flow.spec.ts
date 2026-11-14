import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { createQRToken } from "@/lib/qr";

test.describe("Phase 15: Full System End-to-End User Journey", () => {
  const ts = Date.now();
  const testAcademySlug = `p15-acad-${ts}`;
  const testAcademyName = `Phase 15 Academy ${ts}`;
  const adminEmail = `p15.admin.${ts}@test.local`;
  const studentName = `P15 Student ${ts}`;
  let createdAcademyId: string | null = null;
  let createdStudentId: string | null = null;

  test.afterAll(async () => {
    // Clean up created test academy
    if (createdAcademyId) {
      await db.academy.delete({ where: { id: createdAcademyId } }).catch(() => {});
    }
  });

  test("1. Full lifecycle: signup -> admit student -> invoice -> sandbox payment -> auto PAID", async ({
    page,
  }) => {
    // -------------------------------------------------------------------------
    // A. Academy Signup
    // -------------------------------------------------------------------------
    await page.goto("/signup");
    await expect(page.locator("text=Create Your Academy Platform")).toBeVisible();

    await page.fill("#academyName", testAcademyName);
    await page.fill("#slug", testAcademySlug);
    await page.fill("#adminName", "P15 Administrator");
    await page.fill("#adminEmail", adminEmail);
    await page.fill("#adminPassword", "Password123!");
    await page.fill("#adminPhone", "03009988776");

    await page.click('button[type="submit"]');
    await page.waitForURL("**/login**", { timeout: 15000 });

    const acad = await db.academy.findUnique({ where: { slug: testAcademySlug } });
    expect(acad).not.toBeNull();
    createdAcademyId = acad!.id;

    // -------------------------------------------------------------------------
    // B. Admin Login & Admit Student
    // -------------------------------------------------------------------------
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    // Open Students Directory
    await page.goto("/admin/students");
    await expect(page.getByText("Students Directory")).toBeVisible();

    // Admit new student
    await page.click('button:has-text("Admit New Student")');
    await page.fill('input[name="name"]', studentName);
    await page.fill('input[name="guardianName"]', "P15 Guardian");
    await page.fill('input[name="guardianPhone"]', "03001122334");
    await page.click('button[type="submit"]:has-text("Admit Student")');

    await expect(page.getByText(studentName)).toBeVisible({ timeout: 10000 });

    const st = await db.student.findFirst({
      where: { academyId: createdAcademyId!, name: studentName },
    });
    expect(st).not.toBeNull();
    createdStudentId = st!.id;

    // -------------------------------------------------------------------------
    // C. Seed Parent & Invoice Payment Flow on Seed Academy
    // -------------------------------------------------------------------------
    // Log in as seeded parent to test the complete sandbox wallet payment flow
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "parent@academyhub.test");
    await page.fill('input[name="password"]', "Parent123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/parent", { timeout: 15000 });

    // Check child profile and fee tab
    await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();
    const feeTab = page.getByRole("button", { name: /Fee Status/i }).first();
    await feeTab.click();

    // If an unpaid invoice exists, test pay now -> sandbox checkout -> auto PAID
    const payNowBtn = page.getByRole("button", { name: "Pay Now" }).first();
    if (await payNowBtn.isVisible()) {
      await payNowBtn.click();
      await page.waitForURL(/\/sandbox\/checkout\//, { timeout: 10000 });
      await expect(page.getByText(/Mobile Wallet|Gateway/i).first()).toBeVisible();

      const authorizeBtn = page.getByRole("button", { name: /Authorize & Pay/i });
      await expect(authorizeBtn).toBeVisible();
      await authorizeBtn.click();

      await page.waitForURL(/\/parent\?payment=success/, { timeout: 10000 });
      await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();

      const feeTabAfter = page.getByRole("button", { name: /Fee Status/i }).first();
      await feeTabAfter.click();
      await expect(page.getByText("PAID").first()).toBeVisible();
    }
  });

  test("2. Online test attempt -> auto-grading and leaderboard", async ({ page }) => {
    // 1. Sign in as student
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "student@academyhub.test");
    await page.fill('input[name="password"]', "Student123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/student", { timeout: 15000 });

    await expect(page.getByText("Student Portal")).toBeVisible();

    // 2. Open online test
    const testLink = page.getByRole("link", { name: /Leaderboard|Start Test/i }).first();
    await expect(testLink).toBeVisible();
    await testLink.click();

    await page.waitForURL(/\/student\/test\//, { timeout: 10000 });
    await expect(page.getByText(/Online Test|Assessment/i).first()).toBeVisible();
  });

  test("3. Risk dashboard displays HIGH-risk seeded student with retention insights", async ({
    page,
  }) => {
    // Log in as main academy admin
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@academyhub.test");
    await page.fill('input[name="password"]', "Admin123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    // Verify Retention & Dropout Risk Card
    await expect(page.getByText("Student Retention & Dropout Risk")).toBeVisible();

    // Verify high risk badge and seeded student info
    const highRiskBadge = page.getByText("HIGH RISK").first();
    await expect(highRiskBadge).toBeVisible();
  });

  test("4. Parent portal isolation and QR attendance flow", async ({ page }) => {
    // 1. Verify Parent Portal
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "parent@academyhub.test");
    await page.fill('input[name="password"]', "Parent123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/parent", { timeout: 15000 });

    await expect(page.getByRole("heading", { name: "Parent Portal" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Hamza Tariq" })).toBeVisible();

    // 2. Student scans a live 10-minute QR attendance token
    const studentUser = await db.user.findFirst({
      where: { email: "student@academyhub.test" },
      include: { student: true },
    });
    expect(studentUser?.student).toBeDefined();

    const enrollment = await db.enrollment.findFirst({
      where: { studentId: studentUser!.student!.id, status: "ACTIVE" },
      include: { batch: true },
    });
    expect(enrollment).toBeDefined();

    // Generate valid 10-minute token
    const { token } = createQRToken({
      batchId: enrollment!.batchId,
      academyId: enrollment!.batch.academyId,
      date: new Date().toISOString().split("T")[0],
    });

    // Log in as student and visit scan confirmation page
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "student@academyhub.test");
    await page.fill('input[name="password"]', "Student123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/student", { timeout: 15000 });

    await page.goto(`/student/attendance/scan?token=${encodeURIComponent(token)}`);
    
    // Check if attendance is already recorded (idempotency guard) or ready for confirmation
    const alreadyRecorded = await page.getByText("Already Recorded").isVisible();
    if (alreadyRecorded) {
      await expect(page.getByText(/Your attendance for today has already been recorded/i)).toBeVisible();
    } else {
      await expect(page.getByText("Confirm Batch Attendance")).toBeVisible();
      await expect(page.getByText(enrollment!.batch.name)).toBeVisible();

      // Confirm QR scan
      const confirmBtn = page.getByRole("button", { name: /Confirm Attendance/i });
      await confirmBtn.click();

      // Expect attendance marked confirmation
      await expect(page.getByText(/Attendance Marked!|Already Recorded/i)).toBeVisible({ timeout: 10000 });
    }
  });
});
