"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { AcademyPlan, AcademyStatus, Role } from "@prisma/client";

const RESERVED_SLUGS = new Set([
  "api",
  "admin",
  "superadmin",
  "app",
  "www",
  "login",
  "signup",
  "platform",
  "root",
  "test",
  "support",
  "help",
  "dashboard",
  "billing",
]);

const signupSchema = z.object({
  academyName: z.string().trim().min(3, "Academy name must be at least 3 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Slug must be at least 3 characters")
    .max(30, "Slug must be at most 30 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  adminName: z.string().trim().min(2, "Administrator name is required"),
  adminEmail: z.string().trim().toLowerCase().email("Invalid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminPhone: z.string().trim().optional(),
});

export type SignupInput = z.infer<typeof signupSchema>;

export async function signupAcademyAction(rawData: SignupInput) {
  const parsed = signupSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.errors[0]?.message || "Invalid input data",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { academyName, slug, adminName, adminEmail, adminPassword, adminPhone } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) {
    return {
      success: false,
      error: `The subdomain "${slug}" is reserved. Please choose another one.`,
    };
  }

  // Check slug uniqueness
  const existingSlug = await db.academy.findUnique({
    where: { slug },
  });
  if (existingSlug) {
    return {
      success: false,
      error: `The subdomain "${slug}" is already taken. Please choose another one.`,
    };
  }

  // Check admin email uniqueness
  const existingUser = await db.user.findUnique({
    where: { email: adminEmail },
  });
  if (existingUser) {
    return {
      success: false,
      error: "An account with this email address already exists. Please log in or use a different email.",
    };
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14-day PRO trial

  try {
    const result = await db.$transaction(async (tx) => {
      // 1. Create Academy
      const academy = await tx.academy.create({
        data: {
          name: academyName,
          slug,
          subdomain: slug,
          plan: AcademyPlan.PRO,
          status: AcademyStatus.ACTIVE,
          trialEndsAt,
        },
      });

      // 2. Create Academy Admin User
      const admin = await tx.user.create({
        data: {
          academyId: academy.id,
          name: adminName,
          email: adminEmail,
          passwordHash,
          role: Role.ADMIN,
          phone: adminPhone || null,
        },
      });

      return { academy, admin };
    });

    return {
      success: true,
      academyId: result.academy.id,
      slug: result.academy.slug,
      adminEmail: result.admin.email,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create academy account. Please try again.",
    };
  }
}
