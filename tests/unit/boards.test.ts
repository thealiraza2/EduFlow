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
      // Seeded schemes are placeholders: verified: false, sourceUrl: null
      expect(scheme.verified).toBe(false);
      expect(scheme.sourceUrl).toBeNull();
      expect(sub.chapters.length).toBeGreaterThanOrEqual(3);
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
});
