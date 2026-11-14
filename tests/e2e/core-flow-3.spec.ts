import { test, expect } from "@playwright/test";
import { db } from "@/lib/db";
import { StudentStatus } from "@prisma/client";

test.describe("E2E Core Flow 3: Parent Isolation (Invariant 5)", () => {
  let unlinkedStudentId: string;
  let ownChildId: string;

  test.beforeAll(async () => {
    // 1. Get Hamza Tariq (linked to parent@academyhub.test)
    const hamza = await db.student.findFirst({
      where: { admissionNo: "AH-2026-0001" },
    });
    expect(hamza).not.toBeNull();
    ownChildId = hamza!.id;

    // 2. Create an unlinked student whose guardian is someone else
    const ts = Date.now();
    const otherStudent = await db.student.create({
      data: {
        admissionNo: `AH-TEST-${ts}`,
        name: `Foreign Child ${ts}`,
        guardianName: "Other Guardian",
        guardianPhone: "03110000000",
        guardianUserId: null, // NOT linked to parent@academyhub.test
        status: StudentStatus.ACTIVE,
      },
    });
    unlinkedStudentId = otherStudent.id;
  });

  test.afterAll(async () => {
    if (unlinkedStudentId) {
      await db.student.deleteMany({ where: { id: unlinkedStudentId } });
    }
  });

  test("parent can access own child but gets 403 when attempting to access another child", async ({ page }) => {
    // 1. Log in as Parent
    await page.context().clearCookies();
    await page.goto("/login");
    await page.fill('input[name="email"]', "parent@academyhub.test");
    await page.fill('input[name="password"]', "Parent123!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/parent", { timeout: 15000 });

    // 2. Verify own child is accessible on portal
    await expect(page.getByRole("heading", { name: "Hamza Tariq" })).toBeVisible();

    // 3. Parent navigates to own child's detail page
    await page.goto(`/parent/child/${ownChildId}`);
    await expect(page.getByRole("heading", { name: "Hamza Tariq — Student Profile" })).toBeVisible();

    // 4. Invariant 5 check: Parent attempts direct URL guessing to another child
    await page.goto(`/parent/child/${unlinkedStudentId}`);
    await expect(page.locator('[data-testid="forbidden-403"]')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("403")).toBeVisible();
    await expect(page.getByText("Access Denied")).toBeVisible();
    await expect(
      page.getByText("You are not authorized to view this student profile")
    ).toBeVisible();

    // 5. Invariant 5 check: Direct API request returns HTTP 403 Forbidden
    const apiRes = await page.request.get(`/api/parent/child/${unlinkedStudentId}`);
    expect(apiRes.status()).toBe(403);
    const body = await apiRes.json();
    expect(body.error).toContain("Access denied");

    // 6. Own child API request succeeds with 200 OK
    const ownApiRes = await page.request.get(`/api/parent/child/${ownChildId}`);
    expect(ownApiRes.status()).toBe(200);
    const ownBody = await ownApiRes.json();
    expect(ownBody.success).toBe(true);
    expect(ownBody.data.student.name).toBe("Hamza Tariq");
  });
});
