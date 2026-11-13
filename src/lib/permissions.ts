/**
 * AcademyHub - Role & Permissions Checking Module
 * Server-side authorization rules and resource ownership verification.
 */

import { Role, Teacher, User } from "@prisma/client";
import { db } from "./db";
import { requireUser } from "./auth";

export class AuthorizationError extends Error {
  statusCode: number;

  constructor(message = "Unauthorized access", statusCode = 403) {
    super(message);
    this.name = "AuthorizationError";
    this.statusCode = statusCode;
  }
}

/**
 * Ensures the currently logged-in user is an ADMIN.
 * Returns the admin user or throws a 403 AuthorizationError.
 */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== Role.ADMIN) {
    throw new AuthorizationError("Forbidden: Administrator access required.", 403);
  }
  return user;
}

/**
 * Ensures the currently logged-in user is a TEACHER.
 * Returns the active Teacher record (including user relation) or throws a 403 AuthorizationError.
 */
export async function requireTeacher(): Promise<Teacher & { user: User }> {
  const sessionUser = await requireUser();

  if (sessionUser.role !== Role.TEACHER && sessionUser.role !== Role.ADMIN) {
    throw new AuthorizationError("Forbidden: Teacher access required.", 403);
  }

  const teacher = await db.teacher.findUnique({
    where: { userId: sessionUser.id },
    include: { user: true },
  });

  if (!teacher) {
    throw new AuthorizationError("Forbidden: No teacher profile associated with this account.", 403);
  }

  return teacher;
}

/**
 * Ensures the currently logged-in user is a PARENT.
 * Returns the parent user record or throws a 403 AuthorizationError.
 */
export async function requireParent() {
  const sessionUser = await requireUser();

  if (sessionUser.role !== Role.PARENT) {
    throw new AuthorizationError("Forbidden: Parent access required.", 403);
  }

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
    include: { children: true },
  });

  if (!user) {
    throw new AuthorizationError("Forbidden: Parent user not found.", 403);
  }

  return user;
}

/**
 * Asserts parent has ownership access to a specific student (guardianUserId matches).
 * Scopes every parent-portal query to prevent cross-child data leakage.
 */
export function assertParentOwnsStudent(
  sessionUserId: string,
  userRole: Role,
  studentGuardianUserId: string | null | undefined
): void {
  if (userRole === Role.ADMIN) {
    return; // Admin can inspect any student
  }
  if (userRole !== Role.PARENT || !studentGuardianUserId || sessionUserId !== studentGuardianUserId) {
    throw new AuthorizationError("Access denied: You can only view your own registered children.", 403);
  }
}

/**
 * Asserts teacher is assigned to the specified batch.
 */
export function assertTeacherOwnsBatch(
  teacherId: string,
  userRole: Role,
  batchTeacherId: string | null | undefined
): void {
  if (userRole === Role.ADMIN) {
    return; // Admin has oversight of all batches
  }
  if (userRole !== Role.TEACHER || !batchTeacherId || teacherId !== batchTeacherId) {
    throw new AuthorizationError("Access denied: You can only manage your own assigned batches.", 403);
  }
}
