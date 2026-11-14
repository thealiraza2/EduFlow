import { describe, it, expect, vi } from "vitest";
import { db } from "@/lib/db";
import {
  createBoardAction,
  deleteBoardAction,
  createSubjectAction,
  createChapterAction,
  savePaperSchemeAction,
  verifyPaperSchemeAction,
  deletePaperSchemeAction,
} from "@/lib/actions/boards";
import { TestStatus } from "@prisma/client";

// Mock auth & permissions for server actions called directly in unit tests
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({
    user: {
      id: "mock-admin-id",
      name: "Admin User",
      email: "admin@test.local",
      role: "ADMIN",
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    },
  }),
  requireRole: vi.fn().mockResolvedValue({
    id: "mock-admin-id",
    name: "Admin User",
    email: "admin@test.local",
    role: "ADMIN",
    academyId: "seed-academy-id",
    academySlug: "main",
    academyStatus: "ACTIVE",
  }),
  requireUser: vi.fn(),
}));

vi.mock("@/lib/permissions", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/permissions")>();
  return {
    ...actual,
    requireAdmin: vi.fn().mockResolvedValue({
      id: "mock-admin-id",
      name: "Admin User",
      email: "admin@test.local",
      role: "ADMIN",
      academyId: "seed-academy-id",
      academySlug: "main",
      academyStatus: "ACTIVE",
    }),
  };
});

describe("Phase 13 Patch: Boards, Schemes & Invariant 13 Rules", () => {
  it("verifies seeded boards and unverified schemes exist", async () => {
    const lahoreBoard = await db.board.findUnique({
      where: { name: "BISE Lahore" },
      include: {
        subjects: {
          include: { schemes: true, chapters: true },
        },
      },
    });

    expect(lahoreBoard).toBeDefined();
    expect(lahoreBoard?.province).toBe("Punjab");
    expect(lahoreBoard?.subjects.length).toBeGreaterThanOrEqual(2);

    for (const sub of lahoreBoard!.subjects) {
      expect(sub.schemes.length).toBeGreaterThanOrEqual(1);
      const scheme = sub.schemes[0];
      // Seeded schemes must be unverified until a teacher verifies
      expect(scheme.verified).toBe(false);
      expect(typeof scheme.sourceUrl === "string" || scheme.sourceUrl === null).toBe(true);
    }

    const karachiBoard = await db.board.findUnique({
      where: { name: "BISE Karachi" },
    });
    expect(karachiBoard).toBeDefined();
    expect(karachiBoard?.province).toBe("Sindh");
  });

  it("admin can mark a scheme verified and unverified", async () => {
    const scheme = await db.paperScheme.findFirst({
      where: { verified: false },
    });
    expect(scheme).toBeDefined();

    // 1. Mark verified
    const verifiedResult = await verifyPaperSchemeAction(scheme!.id, true);
    expect(verifiedResult.verified).toBe(true);

    const inDb = await db.paperScheme.findUnique({
      where: { id: scheme!.id },
    });
    expect(inDb?.verified).toBe(true);
    expect(inDb?.verifiedAt).toBeDefined();

    // 2. Mark unverified again
    const unverifiedResult = await verifyPaperSchemeAction(scheme!.id, false);
    expect(unverifiedResult.verified).toBe(false);

    const inDbAfter = await db.paperScheme.findUnique({
      where: { id: scheme!.id },
    });
    expect(inDbAfter?.verified).toBe(false);
  });

  it("scheme with generated papers CANNOT be deleted, only unverified", async () => {
    // 1. Create a dedicated test board, subject, and scheme
    const testBoardName = `Test Board Deletion Guard - ${Date.now()}`;
    const board = await db.board.create({
      data: {
        name: testBoardName,
        province: "Punjab",
      },
    });

    const subject = await db.subject.create({
      data: {
        boardId: board.id,
        className: "9th",
        name: "Test Physics",
      },
    });

    const scheme = await db.paperScheme.create({
      data: {
        boardId: board.id,
        className: "9th",
        subjectId: subject.id,
        structure: {
          mcq: { count: 5, marksEach: 1 },
          short: { count: 2, marksEach: 2 },
          long: { count: 1, marksEach: 5 },
        },
        totalMarks: 14,
        timeMinutes: 45,
        verified: false,
      },
    });

    // Find a batch to associate with the test
    const batch = await db.batch.findFirst();
    expect(batch).toBeDefined();

    // 2. Generate a test linked to this scheme
    const test = await db.test.create({
      data: {
        academyId: batch!.academyId,
        batchId: batch!.id,
        subject: "Test Physics",
        title: "Paper Generated from Scheme",
        totalMarks: 14,
        date: new Date(),
        status: TestStatus.DRAFT,
        schemeId: scheme.id, // Linked to scheme!
      },
    });

    // 3. Attempt to delete the scheme -> MUST BE BLOCKED
    await expect(deletePaperSchemeAction(scheme.id)).rejects.toThrow(
      /cannot be deleted/i
    );

    // Verify scheme still exists in DB
    const schemeStillThere = await db.paperScheme.findUnique({
      where: { id: scheme.id },
    });
    expect(schemeStillThere).toBeDefined();

    // 4. Remove generated test, then deletion should succeed
    await db.test.delete({
      where: { id: test.id },
    });

    const deleteRes = await deletePaperSchemeAction(scheme.id);
    expect(deleteRes.success).toBe(true);

    const schemeDeleted = await db.paperScheme.findUnique({
      where: { id: scheme.id },
    });
    expect(schemeDeleted).toBeNull();

    // Clean up test board
    await db.board.delete({
      where: { id: board.id },
    });
  });

  describe("Phase 13 Patch 2: Punjab Pairing Schemes Import & Partial Guards", () => {
    it("Zod validator accepts valid unverified scheme entry", async () => {
      const { validateSchemeEntry } = await import("../../prisma/seed-schemes");

      const validEntry = {
        board: "All Punjab BISE Boards (unified scheme)",
        className: "9th" as const,
        subject: "Physics",
        totalMarks: 60,
        timeMinutes: 120,
        structure: {
          mcq: { count: 12, marksEach: 1 },
          short: { count: 24, marksEach: 2, attempt: 15 },
          long: { count: 3, marksEach: 9, attempt: 2 },
        },
        sourceUrl: "https://pectaa.edu.pk/official-scheme.pdf",
        verified: false,
        notes: "Official PECTAA 2027 scheme.",
      };

      const result = validateSchemeEntry(validEntry);
      expect(result.subject).toBe("Physics");
      expect(result.verified).toBe(false);
    });

    it("Zod validator strictly REFUSES any scheme entry with verified: true", async () => {
      const { validateSchemeEntry } = await import("../../prisma/seed-schemes");

      const invalidVerifiedEntry = {
        board: "All Punjab BISE Boards (unified scheme)",
        className: "9th" as const,
        subject: "Physics",
        totalMarks: 60,
        timeMinutes: 120,
        structure: {
          mcq: { count: 12, marksEach: 1 },
          short: { count: 24, marksEach: 2 },
          long: { count: 3, marksEach: 9 },
        },
        sourceUrl: "https://pectaa.edu.pk/official-scheme.pdf",
        verified: true, // MUST BE REJECTED!
      };

      expect(() => validateSchemeEntry(invalidVerifiedEntry)).toThrow(
        /verified/i
      );
    });

    it("Zod validator rejects bad entries (invalid class, negative marks, invalid URL)", async () => {
      const { validateSchemeEntry } = await import("../../prisma/seed-schemes");

      const baseValid = {
        board: "All Punjab BISE Boards (unified scheme)",
        className: "9th" as const,
        subject: "Mathematics",
        totalMarks: 75,
        timeMinutes: 150,
        structure: {
          mcq: { count: 15, marksEach: 1 },
        },
        sourceUrl: "https://example.com/scheme.pdf",
        verified: false,
      };

      // 1. Invalid class (e.g. 8th is out of scope)
      expect(() =>
        validateSchemeEntry({ ...baseValid, className: "8th" as any })
      ).toThrow(/className/i);

      // 2. Negative or zero totalMarks
      expect(() =>
        validateSchemeEntry({ ...baseValid, totalMarks: -50 })
      ).toThrow(/positive/i);
      expect(() =>
        validateSchemeEntry({ ...baseValid, totalMarks: 0 })
      ).toThrow(/positive/i);

      // 3. Invalid URL
      expect(() =>
        validateSchemeEntry({ ...baseValid, sourceUrl: "not-a-valid-url" })
      ).toThrow(/valid URL/i);
    });

    it("verifies 9 Punjab boards and 288 PaperScheme rows (32 x 9) in database", async () => {
      const punjabBoardNames = [
        "BISE Lahore",
        "BISE Gujranwala",
        "BISE Multan",
        "BISE Faisalabad",
        "BISE Sargodha",
        "BISE Rawalpindi",
        "BISE Bahawalpur",
        "BISE D.G. Khan",
        "BISE Sahiwal",
      ];

      const boards = await db.board.findMany({
        where: { name: { in: punjabBoardNames } },
        include: { schemes: true },
      });

      expect(boards.length).toBe(9);

      let totalPunjabSchemes = 0;
      for (const b of boards) {
        expect(b.province).toBe("Punjab");
        expect(b.schemes.length).toBe(32);
        totalPunjabSchemes += b.schemes.length;

        // All seeded schemes must be verified: false
        for (const s of b.schemes) {
          expect(s.verified).toBe(false);
        }
      }

      expect(totalPunjabSchemes).toBe(288);
    });

    it("generator guard refuses to generate paper from a partial scheme lacking short or long sections", async () => {
      const { generateBoardPaper } = await import("@/lib/ai");

      // Find a partial scheme (e.g. 9th English or 10th English)
      const partialScheme = await db.paperScheme.findFirst({
        where: {
          notes: { startsWith: "PARTIAL:" },
        },
      });

      expect(partialScheme).toBeDefined();
      expect(partialScheme?.notes).toMatch(/^PARTIAL:/);

      const genResult = await generateBoardPaper({
        boardName: "BISE Lahore",
        className: partialScheme!.className,
        subject: "Partial Subject",
        chapters: [{ number: 1, title: "Intro" }],
        scheme: {
          id: partialScheme!.id,
          structure: partialScheme!.structure as any,
          totalMarks: partialScheme!.totalMarks,
          timeMinutes: partialScheme!.timeMinutes,
          verified: partialScheme!.verified,
        },
        difficulty: "MEDIUM",
      });

      expect(genResult.success).toBe(false);
      expect(genResult.error).toContain(
        "Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao."
      );
    });
  });
});
