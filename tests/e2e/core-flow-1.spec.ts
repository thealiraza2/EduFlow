import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { getTestCredentials } from "../helpers/credentials";

test.describe("E2E Core Flow 1: Admission → Attendance → Fee Invoicing → Payment → Challan PDF", () => {
  const ts = Date.now();
  const studentName = `Zubair E2E Khan ${ts}`;
  const guardianPhone = "03001239999";
  let createdStudentId: string | null = null;
  let createdInvoiceId: string | null = null;

  test.afterAll(async () => {
    // Cleanup created test records from DB
    if (createdStudentId) {
      await db.feePayment.deleteMany({ where: { invoice: { studentId: createdStudentId } } });
      await db.feeInvoice.deleteMany({ where: { studentId: createdStudentId } });
      await db.attendance.deleteMany({ where: { enrollment: { studentId: createdStudentId } } });
      await db.enrollment.deleteMany({ where: { studentId: createdStudentId } });
      await db.student.deleteMany({ where: { id: createdStudentId } });
    }
  });

  test("completes full student lifecycle from admission to fee receipt PDF", async ({ page, request }) => {
    const { adminPassword, teacherPassword } = getTestCredentials();

    // -------------------------------------------------------------------------
    // Step 1: Admin Logs In & Admits New Student
    // -------------------------------------------------------------------------
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@eduflow.test");
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    // Navigate to Students Directory
    await page.goto("/admin/students");
    await expect(page.getByText("Students Directory")).toBeVisible();

    // Open Admit Modal & Submit Student Details
    await page.click('button:has-text("Admit New Student")');
    await page.fill('input[name="name"]', studentName);
    await page.fill('input[name="guardianName"]', "Tariq E2E Khan");
    await page.fill('input[name="guardianPhone"]', guardianPhone);
    await page.click('button[type="submit"]:has-text("Admit Student")');

    // Wait for student list to update
    await expect(page.getByText(studentName)).toBeVisible({ timeout: 10000 });

    // Find student in DB to get ID
    const student = await db.student.findFirst({
      where: { name: studentName },
      orderBy: { createdAt: "desc" },
    });
    expect(student).not.toBeNull();
    createdStudentId = student!.id;

    // -------------------------------------------------------------------------
    // Step 2: Enroll Student into Evening Batch
    // -------------------------------------------------------------------------
    await page.goto(`/admin/students/${createdStudentId}`);
    await expect(page.getByText(studentName)).toBeVisible();

    // Find Evening Batch
    const eveningBatch = await db.batch.findFirst({ where: { name: "Evening Batch" } });
    expect(eveningBatch).not.toBeNull();

    // Click Enroll in Batch
    await page.click('button:has-text("Enroll In Batch")');
    const batchDialog = page.locator('div[role="dialog"]');
    await batchDialog.locator("select").selectOption(eveningBatch!.id);
    await batchDialog.locator('button[type="submit"]:has-text("Confirm Enrollment")').click();

    // Dialog closes upon success
    await expect(batchDialog).toBeHidden({ timeout: 10000 });

    // Verify batch is visible in table
    await page.reload();
    await expect(page.locator("table").getByText("Evening Batch")).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // Step 3: Teacher Marks Attendance for the Enrolled Batch
    // -------------------------------------------------------------------------
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "usman.teacher@eduflow.test");
    await page.fill('input[name="password"]', teacherPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/teacher", { timeout: 15000 });

    await page.goto("/teacher/attendance");
    await expect(page.getByRole("heading", { name: "Batch Attendance" })).toBeVisible();

    // Student should be present on roster
    await expect(page.getByText(studentName)).toBeVisible({ timeout: 10000 });

    // Click "Save Attendance"
    const saveButton = page.locator('button:has-text("Save Attendance")');
    await saveButton.click();

    // Verify success feedback
    await expect(page.getByText(/Attendance saved successfully/i)).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // Step 4: Admin Generates Monthly Invoice & Records Fee Payment
    // -------------------------------------------------------------------------
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "admin@eduflow.test");
    await page.fill('input[name="password"]', adminPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/admin", { timeout: 15000 });

    await page.goto("/admin/fees");
    await expect(page.getByRole("heading", { name: "Fee Management" })).toBeVisible();

    // Click Generate Invoices button
    await page.locator('button:has-text("Generate")').click();
    await expect(page.getByText(/Invoicing complete/i)).toBeVisible({ timeout: 15000 });

    // Reload or check table for student invoice
    await page.reload();
    await expect(page.getByText(studentName)).toBeVisible({ timeout: 10000 });

    // Find the invoice in DB
    const invoice = await db.feeInvoice.findFirst({
      where: { studentId: createdStudentId },
      orderBy: { createdAt: "desc" },
    });
    expect(invoice).not.toBeNull();
    createdInvoiceId = invoice!.id;

    // Find row for student and click Collect
    const studentRow = page.locator("tr", { hasText: studentName });
    await studentRow.locator('button:has-text("Collect")').click();

    // Click "Pay Full Balance"
    await page.click('button:has-text("Pay Full Balance")');
    // Click Record Payment submit button in payment dialog
    await page.locator('div[role="dialog"]').locator('button[type="submit"]:has-text("Record Payment")').click();

    // Verify Payment registered
    await page.reload();
    const updatedRow = page.locator("tr", { hasText: studentName });
    await expect(updatedRow.getByText("PAID")).toBeVisible({ timeout: 10000 });

    // -------------------------------------------------------------------------
    // Step 5: Challan PDF Download
    // -------------------------------------------------------------------------
    const challanResponse = await page.request.get(`/api/invoices/${createdInvoiceId}/challan`);
    expect(challanResponse.status()).toBe(200);
    expect(challanResponse.headers()["content-type"]).toContain("application/pdf");

    const pdfBuffer = await challanResponse.body();
    // Verify valid PDF header "%PDF-"
    const pdfHeader = pdfBuffer.slice(0, 5).toString("ascii");
    expect(pdfHeader).toBe("%PDF-");
  });
});
