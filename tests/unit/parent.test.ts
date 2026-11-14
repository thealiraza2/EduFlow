import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { db } from "@/lib/db";
import { getParentChildData, getParentDashboardData } from "@/lib/parent";
import { AuthorizationError } from "@/lib/permissions";
import { GET as getChildRouteHandler } from "@/app/api/parent/child/[id]/route";
import { NextRequest } from "next/server";
import { Role } from "@prisma/client";

// Mock auth for HTTP testing
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
  requireRole: vi.fn(),
  requireUser: vi.fn(),
}));

import { auth } from "@/lib/auth";

describe("Phase 7: Parent Portal & Strict Child Isolation (Invariant 5)", () => {
  let parentAId: string;
  let studentAId: string;
  let parentBId: string;
  let studentBId: string;
  let testClassId: string;
  let testBatchId: string;

  beforeAll(async () => {
    // 1. Create Class and Batch
    const cls = await db.class.create({
      data: {
        name: "Test-Parent-Class",
        section: "A",
        capacity: 30,
      },
    });
    testClassId = cls.id;

    const batch = await db.batch.create({
      data: {
        classId: testClassId,
        name: "Evening Batch",
        timing: "4-6 PM",
        feeMinor: 400000,
      },
    });
    testBatchId = batch.id;

    // 2. Create Parent A and Student A
    const parentA = await db.user.create({
      data: {
        email: `parentA.${Date.now()}@test.local`,
        passwordHash: "hash",
        name: "Parent A",
        role: Role.PARENT,
        phone: "03001110001",
      },
    });
    parentAId = parentA.id;

    const studentA = await db.student.create({
      data: {
        admissionNo: `TEST-STUDENT-A-${Date.now()}`,
        name: "Child of Parent A",
        guardianName: "Parent A",
        guardianPhone: "03001110001",
        guardianUserId: parentAId,
      },
    });
    studentAId = studentA.id;

    await db.enrollment.create({
      data: {
        studentId: studentAId,
        batchId: testBatchId,
      },
    });

    // 3. Create Parent B and Student B
    const parentB = await db.user.create({
      data: {
        email: `parentB.${Date.now()}@test.local`,
        passwordHash: "hash",
        name: "Parent B",
        role: Role.PARENT,
        phone: "03001110002",
      },
    });
    parentBId = parentB.id;

    const studentB = await db.student.create({
      data: {
        admissionNo: `TEST-STUDENT-B-${Date.now()}`,
        name: "Child of Parent B",
        guardianName: "Parent B",
        guardianPhone: "03001110002",
        guardianUserId: parentBId,
      },
    });
    studentBId = studentB.id;

    await db.enrollment.create({
      data: {
        studentId: studentBId,
        batchId: testBatchId,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (studentAId) {
      await db.enrollment.deleteMany({ where: { studentId: studentAId } });
      await db.student.delete({ where: { id: studentAId } });
    }
    if (studentBId) {
      await db.enrollment.deleteMany({ where: { studentId: studentBId } });
      await db.student.delete({ where: { id: studentBId } });
    }
    if (parentAId) await db.user.delete({ where: { id: parentAId } });
    if (parentBId) await db.user.delete({ where: { id: parentBId } });
    if (testBatchId) await db.batch.delete({ where: { id: testBatchId } });
    if (testClassId) await db.class.delete({ where: { id: testClassId } });
  });

  it("Parent dashboard data strictly returns only linked children for that parent", async () => {
    const dataA = await getParentDashboardData(parentAId, Role.PARENT);
    expect(dataA.children.length).toBe(1);
    expect(dataA.children[0].student.id).toBe(studentAId);
    expect(dataA.children[0].student.name).toBe("Child of Parent A");

    const dataB = await getParentDashboardData(parentBId, Role.PARENT);
    expect(dataB.children.length).toBe(1);
    expect(dataB.children[0].student.id).toBe(studentBId);
    expect(dataB.children[0].student.name).toBe("Child of Parent B");
  });

  it("Service layer: Parent A reading their own child succeeds", async () => {
    const child = await getParentChildData(parentAId, studentAId, Role.PARENT);
    expect(child).toBeDefined();
    expect(child.student.id).toBe(studentAId);
    expect(child.student.name).toBe("Child of Parent A");
  });

  it("Service layer (Invariant 5): Parent A attempting to read Parent B's child throws 403 AuthorizationError", async () => {
    await expect(
      getParentChildData(parentAId, studentBId, Role.PARENT)
    ).rejects.toThrow(AuthorizationError);

    try {
      await getParentChildData(parentAId, studentBId, Role.PARENT);
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.message).toContain("Access denied");
    }
  });

  it("HTTP layer (Invariant 5): Parent A requesting Parent B's child via API returns HTTP 403 Forbidden", async () => {
    // Mock session as Parent A
    (auth as any).mockResolvedValueOnce({
      user: {
        id: parentAId,
        role: Role.PARENT,
        name: "Parent A",
        email: "parentA@test.local",
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/parent/child/${studentBId}`);
    const res = await getChildRouteHandler(req, { params: { id: studentBId } });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain("Access denied");
  });

  it("HTTP layer: Parent A requesting their own child via API returns HTTP 200 OK", async () => {
    // Mock session as Parent A
    (auth as any).mockResolvedValueOnce({
      user: {
        id: parentAId,
        role: Role.PARENT,
        name: "Parent A",
        email: "parentA@test.local",
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/parent/child/${studentAId}`);
    const res = await getChildRouteHandler(req, { params: { id: studentAId } });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.student.id).toBe(studentAId);
  });
});
