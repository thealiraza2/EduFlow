/**
 * EduFlow - Multi-Tenancy & Tenant Resolution Module
 * Enforces strict isolation across academies.
 *
 * INVARIANT: Every tenant data query must include where: { academyId }.
 */

import { auth } from "./auth";
import { db } from "./db";
import { Academy, AcademyStatus, Role, User } from "@prisma/client";
import { AuthorizationError } from "./permissions";
import { cookies } from "next/headers";

/** Cookie holding the academy a SUPER_ADMIN is currently managing. */
export const SUPER_ADMIN_ACADEMY_COOKIE = "ef_sa_academy";

function getSuperAdminAcademyCookie(): string | null {
  try {
    return cookies().get(SUPER_ADMIN_ACADEMY_COOKIE)?.value || null;
  } catch {
    // Outside a request (e.g. unit tests)
    return null;
  }
}

export interface TenantContext {
  academyId: string;
  academy: Academy;
  isSuperAdmin: boolean;
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    academyId?: string | null;
    academySlug?: string | null;
  };
}

/**
 * Resolves the authenticated user's tenant context.
 * Throws 401 if unauthenticated, 403 if tenant missing or suspended.
 */
export async function requireTenant(): Promise<TenantContext> {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError("Unauthorized: Session required", 401);
  }

  const user = session.user;

  // SUPER_ADMIN platform owner access
  if (user.role === Role.SUPER_ADMIN) {
    // The academy the super admin chose in the platform console ("Open as admin")
    // wins; otherwise their own academy; otherwise the first active one.
    let targetAcademyId = getSuperAdminAcademyCookie() || user.academyId;
    let academy: Academy | null = null;

    if (targetAcademyId) {
      academy = await db.academy.findUnique({ where: { id: targetAcademyId } });
    }
    if (!academy) {
      // Look up first active academy
      academy = await db.academy.findFirst({ where: { status: AcademyStatus.ACTIVE } });
    }

    if (!academy) {
      throw new AuthorizationError(
        "No active academy tenant found. Super admin operations on tenant-specific resources require at least one active academy.",
        400
      );
    }

    return {
      academyId: academy.id,
      academy,
      isSuperAdmin: true,
      user: {
        id: user.id,
        email: user.email || "",
        name: user.name || "Super Admin",
        role: user.role,
        academyId: academy.id,
        academySlug: academy.slug,
      },
    };
  }

  // Tenant User (ADMIN, TEACHER, PARENT)
  const academyId = user.academyId;
  if (!academyId) {
    throw new AuthorizationError("Forbidden: Tenant context missing", 403);
  }

  const academy = await db.academy.findUnique({
    where: { id: academyId },
  });

  if (!academy) {
    throw new AuthorizationError("Forbidden: Academy does not exist", 403);
  }

  if (academy.status === AcademyStatus.SUSPENDED) {
    throw new AuthorizationError(
      "Forbidden: This academy account is currently suspended. Please contact platform support.",
      403
    );
  }

  return {
    academyId: academy.id,
    academy,
    isSuperAdmin: false,
    user: {
      id: user.id,
      email: user.email || "",
      name: user.name || "User",
      role: user.role,
      academyId: academy.id,
      academySlug: academy.slug,
    },
  };
}

/**
 * Helper to automatically inject { academyId } into any Prisma where clause.
 * Ensures queries never run un-scoped across tenants.
 */
export function scopeWhere<T extends Record<string, any>>(
  academyId: string,
  where?: T
): T & { academyId: string } {
  return {
    ...(where || ({} as T)),
    academyId,
  };
}

/**
 * Resolves tenant slug from Host header (e.g. "alpha.eduflow.app" -> "alpha")
 */
export function extractSubdomain(host: string | null): string | null {
  if (!host) return null;
  const cleanHost = host.split(":")[0].toLowerCase();

  // Ignored hostnames (root domain or common dev hosts)
  if (
    cleanHost === "localhost" ||
    cleanHost === "127.0.0.1" ||
    cleanHost === "eduflow.app" ||
    cleanHost === "academyhub.app" ||
    cleanHost.endsWith(".vercel.app") ||
    cleanHost.startsWith("www.") ||
    cleanHost.startsWith("app.")
  ) {
    return null;
  }

  // Format: <subdomain>.eduflow.app or <subdomain>.localhost
  const parts = cleanHost.split(".");
  if (parts.length >= 2) {
    return parts[0];
  }

  return null;
}
