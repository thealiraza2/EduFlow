import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { signupAcademyAction } from "@/lib/actions/signup";
import { toggleAcademyStatusAction, updateAcademyPlanAction } from "@/lib/actions/superadmin";
import { requireTenant, scopeWhere } from "@/lib/tenant";
import { generateNextAdmissionNumber } from "@/lib/admission";
import { generateMonthlyInvoices } from "@/lib/fees";
import { Role, AcademyStatus, AcademyPlan } from "@prisma/client";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

let mockUser: any = null;

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockImplementation(async () => (mockUser ? { user: mockUser } : null)),
  requireRole: vi.fn().mockImplementation(async () => mockUser),
  requireUser: vi.fn().mockImplementation(async () => mockUser),
}));

describe("Phase 10: Multi-branch SaaS & Tenant Isolation", () => {
  const ts = Date.now();
  const slugA = `academy-a-${ts}`;
  const slugB = `academy-b-${ts}`;
  let academyAId: string;
  let academyBId: string;
  let adminAUser: any;
  let adminBUser: any;
  let studentAId: string;
  let studentBId: string;
  let batchAId: string;
  let batchBId: string;

  beforeAll(async () => {
    // 1. Create Academy A via signupAction
    const signupA = await signupAcademyAction({
      academyName: `Academy Alpha ${ts}`,
      slug: slugA,
      adminName: "Admin Alpha",
      adminEmail: `admin.alpha.${ts}@test.local`,
      adminPassword: "Password123!",
      adminPhone: "03001112233",
    });
    expect(signupA.success).toBe(true);
    academyAId = signupA.academyId!;

    const userA = await db.user.findUnique({
      where: { email: `admin.alpha.${ts}@test.local` },
    });
    adminAUser = userA;

    // 2. Create Academy B via signupAction
    const signupB = await signupAcademyAction({
      academyName: `Academy Beta ${ts}`,
      slug: slugB,
      adminName: "Admin Beta",
      adminEmail: `admin.beta.${ts}@test.local`,
      adminPassword: "Password123!",
      adminPhone: "03004445566",
    });
    expect(signupB.success).toBe(true);
    academyBId = signupB.academyId!;

    const userB = await db.user.findUnique({
      where: { email: `admin.beta.${ts}@test.local` },
    });
    adminBUser = userB;
  });

  afterAll(async () => {
    // Cleanup Academy A & B (cascades to all tenant rows)
    if (academyAId) {
      await db.academy.delete({ where: { id: academyAId } }).catch(() => {});
    }
    if (academyBId) {
      await db.academy.delete({ where: { id: academyBId } }).catch(() => {});
    }
  });

  describe("1. Academy Signup & Subdomain Reservation", () => {
    it("creates an academy and admin in an atomic transaction with a 14-day PRO trial", async () => {
      const academy = await db.academy.findUnique({ where: { id: academyAId } });
      expect(academy).toBeDefined();
      expect(academy?.slug).toBe(slugA);
      expect(academy?.plan).toBe(AcademyPlan.PRO);
      expect(academy?.status).toBe(AcademyStatus.ACTIVE);
      expect(academy?.trialEndsAt).toBeDefined();

      // Trial should be ~14 days from now
      const trialMs = academy!.trialEndsAt!.getTime() - academy!.createdAt.getTime();
      const trialDays = Math.round(trialMs / (1000 * 60 * 60 * 24));
      expect(trialDays).toBe(14);

      // Admin user has role ADMIN and is linked to academyA
      expect(adminAUser.role).toBe(Role.ADMIN);
      expect(adminAUser.academyId).toBe(academyAId);
    });

    it("rejects duplicate academy slugs", async () => {
      const dup = await signupAcademyAction({
        academyName: "Duplicate Slug Academy",
        slug: slugA,
        adminName: "Duplicate Admin",
        adminEmail: `dup.${Date.now()}@test.local`,
        adminPassword: "Password123!",
      });
      expect(dup.success).toBe(false);
      expect(dup.error).toMatch(/already taken/i);
    });

    it("rejects reserved system subdomains", async () => {
      const reserved = ["admin", "superadmin", "api", "app", "dashboard", "billing"];
      for (const res of reserved) {
        const result = await signupAcademyAction({
          academyName: "Reserved Slug Academy",
          slug: res,
          adminName: "Reserved Admin",
          adminEmail: `res.${Date.now()}.${res}@test.local`,
          adminPassword: "Password123!",
        });
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/is reserved/i);
      }
    });
  });

  describe("2. Sequence & Composite Uniqueness per Tenant", () => {
    it("allows both Academy A and Academy B to have the exact same admission number (e.g. AH-2026-0001)", async () => {
      // Generate admission number for Academy A
      const admNoA = await generateNextAdmissionNumber(db as any, 2026, academyAId);
      expect(admNoA).toBe("AH-2026-0001");

      const studentA = await db.student.create({
        data: {
          academyId: academyAId,
          admissionNo: admNoA,
          name: "Student in Academy A",
          guardianName: "Parent A",
          guardianPhone: "03001234567",
        },
      });
      studentAId = studentA.id;

      // Generate admission number for Academy B
      const admNoB = await generateNextAdmissionNumber(db as any, 2026, academyBId);
      expect(admNoB).toBe("AH-2026-0001"); // Scoped sequence starts at 1 for Academy B!

      const studentB = await db.student.create({
        data: {
          academyId: academyBId,
          admissionNo: admNoB,
          name: "Student in Academy B",
          guardianName: "Parent B",
          guardianPhone: "03007654321",
        },
      });
      studentBId = studentB.id;

      expect(studentA.admissionNo).toBe(studentB.admissionNo);
      expect(studentA.academyId).not.toBe(studentB.academyId);
    });

    it("rejects duplicate admission number within the SAME academy", async () => {
      await expect(
        db.student.create({
          data: {
            academyId: academyAId,
            admissionNo: "AH-2026-0001",
            name: "Collision Student",
            guardianName: "Parent Collision",
            guardianPhone: "03000000000",
          },
        })
      ).rejects.toThrow();
    });
  });

  describe("3. Cross-Tenant Data Isolation", () => {
    beforeAll(async () => {
      // Create a class and batch in Academy A
      const classA = await db.class.create({
        data: {
          academyId: academyAId,
          name: "Class 10th A",
          section: "A",
          capacity: 30,
        },
      });

      const batchA = await db.batch.create({
        data: {
          academyId: academyAId,
          classId: classA.id,
          name: "Alpha Morning",
          timing: "8-10 AM",
          feeMinor: 500000,
        },
      });
      batchAId = batchA.id;

      await db.enrollment.create({
        data: {
          academyId: academyAId,
          studentId: studentAId,
          batchId: batchAId,
        },
      });

      // Create a class and batch in Academy B
      const classB = await db.class.create({
        data: {
          academyId: academyBId,
          name: "Class 10th B",
          section: "B",
          capacity: 30,
        },
      });

      const batchB = await db.batch.create({
        data: {
          academyId: academyBId,
          classId: classB.id,
          name: "Beta Evening",
          timing: "4-6 PM",
          feeMinor: 600000,
        },
      });
      batchBId = batchB.id;

      await db.enrollment.create({
        data: {
          academyId: academyBId,
          studentId: studentBId,
          batchId: batchBId,
        },
      });
    });

    it("tenant query helper scopeWhere properly scopes where clauses", () => {
      const scoped = scopeWhere(academyAId, { status: "ACTIVE" });
      expect(scoped).toEqual({ status: "ACTIVE", academyId: academyAId });
    });

    it("queries for Academy A students do not return Academy B students", async () => {
      const studentsA = await db.student.findMany({
        where: { academyId: academyAId },
      });
      const idsA = studentsA.map((s) => s.id);
      expect(idsA).toContain(studentAId);
      expect(idsA).not.toContain(studentBId);

      const studentsB = await db.student.findMany({
        where: { academyId: academyBId },
      });
      const idsB = studentsB.map((s) => s.id);
      expect(idsB).toContain(studentBId);
      expect(idsB).not.toContain(studentAId);
    });

    it("generating invoices in Academy A creates invoices ONLY for Academy A", async () => {
      const resA = await generateMonthlyInvoices("2026-12", new Date(), db, {
        academyId: academyAId,
      });

      expect(resA.createdCount).toBe(1);

      // Verify Academy B has 0 invoices for this month
      const invoicesB = await db.feeInvoice.findMany({
        where: { academyId: academyBId, month: "2026-12" },
      });
      expect(invoicesB.length).toBe(0);

      // Generating for Academy B now creates Academy B's invoices
      const resB = await generateMonthlyInvoices("2026-12", new Date(), db, {
        academyId: academyBId,
      });
      expect(resB.createdCount).toBe(1);

      const invoicesBAfter = await db.feeInvoice.findMany({
        where: { academyId: academyBId, month: "2026-12" },
      });
      expect(invoicesBAfter.length).toBe(1);
    });
  });

  describe("4. Suspension & Tenant Guard", () => {
    it("throws 403 when an active user belongs to a SUSPENDED academy", async () => {
      // Suspend Academy B
      await db.academy.update({
        where: { id: academyBId },
        data: { status: AcademyStatus.SUSPENDED },
      });

      // User session from Academy B
      mockUser = {
        id: adminBUser.id,
        email: adminBUser.email,
        role: Role.ADMIN,
        academyId: academyBId,
        academySlug: slugB,
        academyStatus: AcademyStatus.SUSPENDED,
      };

      await expect(requireTenant()).rejects.toThrow(
        /currently suspended/i
      );

      // Reinstate Academy B
      await db.academy.update({
        where: { id: academyBId },
        data: { status: AcademyStatus.ACTIVE },
      });
    });
  });

  describe("5. Super Admin Platform Controls", () => {
    it("superadmin can toggle academy status and plan", async () => {
      // Setup superadmin session
      mockUser = {
        id: "superadmin-mock-id",
        email: "superadmin@academyhub.test",
        role: Role.SUPER_ADMIN,
        academyId: null,
      };

      // Toggle status to SUSPENDED
      const res1 = await toggleAcademyStatusAction(academyAId, AcademyStatus.SUSPENDED);
      expect(res1.success).toBe(true);
      expect(res1.status).toBe(AcademyStatus.SUSPENDED);

      let academyA = await db.academy.findUnique({ where: { id: academyAId } });
      expect(academyA?.status).toBe(AcademyStatus.SUSPENDED);

      // Toggle status back to ACTIVE
      const res2 = await toggleAcademyStatusAction(academyAId, AcademyStatus.ACTIVE);
      expect(res2.success).toBe(true);
      expect(res2.status).toBe(AcademyStatus.ACTIVE);

      // Change plan to FREE
      const planRes = await updateAcademyPlanAction(academyAId, AcademyPlan.FREE);
      expect(planRes.success).toBe(true);
      expect(planRes.plan).toBe(AcademyPlan.FREE);

      academyA = await db.academy.findUnique({ where: { id: academyAId } });
      expect(academyA?.plan).toBe(AcademyPlan.FREE);
    });
  });
});
