import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;

        const user = await db.user.findUnique({
          where: { email },
          include: { teacher: true, academy: true },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          teacherId: user.teacher?.id ?? null,
          academyId: user.academyId ?? null,
          academySlug: user.academy?.slug ?? null,
          academyStatus: user.academy?.status ?? null,
        };
      },
    }),
  ],
});

/**
 * Server-side helper to ensure user is logged in.
 * Returns the authenticated user session or throws Error("UNAUTHORIZED").
 */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("UNAUTHORIZED");
  }
  return session.user;
}

/**
 * Server-side helper to ensure user has one of the allowed roles.
 * Returns the authenticated user or throws Error("FORBIDDEN").
 */
export async function requireRole(allowedRoles: Role | Role[]) {
  const user = await requireUser();
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (!roles.includes(user.role)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}
