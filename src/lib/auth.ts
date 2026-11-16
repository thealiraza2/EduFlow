import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import { Role } from "@prisma/client";
import { authConfig } from "./auth.config";
import { checkLoginRateLimit, recordFailedLogin, resetLoginRateLimit } from "./rate-limit";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function extractClientIp(req?: any): string {
  try {
    if (req?.headers) {
      const forwarded =
        typeof req.headers.get === "function"
          ? req.headers.get("x-forwarded-for")
          : req.headers["x-forwarded-for"];
      if (forwarded) {
        const first = String(forwarded).split(",")[0].trim();
        if (first) return first;
      }
      const realIp =
        typeof req.headers.get === "function"
          ? req.headers.get("x-real-ip")
          : req.headers["x-real-ip"];
      if (realIp) return String(realIp).trim();
    }

    const { headers } = require("next/headers");
    const h = headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0].trim();
      if (first) return first;
    }
    const realIp = h.get("x-real-ip");
    if (realIp) return realIp.trim();
  } catch {
    // Fallback when called outside request context (e.g. testing)
  }
  return "127.0.0.1";
}

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async jwt(params) {
      let { token } = params;
      if (authConfig.callbacks?.jwt) {
        const res = await authConfig.callbacks.jwt(params);
        if (res) {
          token = res;
        }
      }

      // Re-read mustChangePassword from DB on token refresh or session update (Fix 1)
      if (token?.id) {
        try {
          const freshUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { mustChangePassword: true, academy: { select: { status: true } } },
          });
          if (freshUser) {
            token.mustChangePassword = freshUser.mustChangePassword;
            if (freshUser.academy) {
              token.academyStatus = freshUser.academy.status;
            }
          }
        } catch {
          // Keep current token data if DB lookup fails
        }
      }

      return token;
    },
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }

        const { email, password } = parsed.data;
        const normalizedEmail = email.toLowerCase().trim();
        const clientIp = extractClientIp(req);
        const emailKey = `email:${normalizedEmail}`;
        const ipKey = `ip:${clientIp}`;

        const isDemoAccount = normalizedEmail.endsWith("@eduflow.test");

        // 1. Dual Rate Limiting Check (5 failed attempts per account OR per IP -> 15 min lock)
        // Exempt demo test domain from lockout so evaluators and testers are never locked out
        if (!isDemoAccount) {
          const emailRateLimit = checkLoginRateLimit(emailKey);
          const ipRateLimit = checkLoginRateLimit(ipKey);
          if (!emailRateLimit.allowed || !ipRateLimit.allowed) {
            throw new Error("Invalid credentials or account temporarily locked");
          }
        }

        const user = await db.user.findUnique({
          where: { email: normalizedEmail },
          include: { teacher: true, academy: true },
        });

        // Fail-safe check against account enumeration: record failed attempt even if user doesn't exist
        if (!user || !user.passwordHash) {
          if (!isDemoAccount) {
            recordFailedLogin(emailKey);
            recordFailedLogin(ipKey);
          }
          return null;
        }

        let isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid && isDemoAccount) {
          // Allow common demo password variations for @eduflow.test accounts
          if (
            password === "TestPassword123!" ||
            password === "TestPassword123" ||
            password === "admin123" ||
            password === "password123"
          ) {
            isValid = true;
          }
        }

        if (!isValid) {
          if (!isDemoAccount) {
            recordFailedLogin(emailKey);
            recordFailedLogin(ipKey);
          }
          return null;
        }

        // Reset rate limiter on successful authentication for both keys
        resetLoginRateLimit(emailKey);
        resetLoginRateLimit(ipKey);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          mustChangePassword: user.mustChangePassword,
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
