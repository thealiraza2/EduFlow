/**
 * AcademyHub - Role & Permissions Checking Module
 * Server-side authorization rules and resource ownership verification.
 */

export type UserRole = "ADMIN" | "TEACHER" | "PARENT";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  teacherId?: string; // Present if user is a teacher
}

export class AuthorizationError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Asserts user has one of the allowed roles.
 */
export function assertRole(user: SessionUser | null | undefined, allowedRoles: UserRole[]): asserts user is SessionUser {
  if (!user) {
    throw new AuthorizationError("Authentication required.");
  }
  if (!allowedRoles.includes(user.role)) {
    throw new AuthorizationError(`Access forbidden for role: ${user.role}`);
  }
}

/**
 * Asserts user is an ADMIN.
 */
export function assertAdmin(user: SessionUser | null | undefined): asserts user is SessionUser {
  assertRole(user, ["ADMIN"]);
}

/**
 * Asserts parent has ownership access to a specific student (guardianUserId matches).
 */
export function assertParentOwnsStudent(user: SessionUser, studentGuardianUserId: string | null | undefined): void {
  if (user.role === "ADMIN") {
    return; // Admin can inspect any student
  }
  if (user.role !== "PARENT" || !studentGuardianUserId || user.id !== studentGuardianUserId) {
    throw new AuthorizationError("Access denied: You can only view your own registered children.");
  }
}

/**
 * Asserts teacher is assigned to the specified batch.
 */
export function assertTeacherOwnsBatch(user: SessionUser, batchTeacherId: string): void {
  if (user.role === "ADMIN") {
    return; // Admin has oversight of all batches
  }
  if (user.role !== "TEACHER" || !user.teacherId || user.teacherId !== batchTeacherId) {
    throw new AuthorizationError("Access denied: You can only manage your own assigned batches.");
  }
}
