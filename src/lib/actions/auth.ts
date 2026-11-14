"use server";

import { signIn, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  callbackUrl: z.string().optional(),
});

export interface LoginActionState {
  error?: string;
  fieldErrors?: {
    email?: string[];
    password?: string[];
  };
}

export async function loginAction(
  prevState: LoginActionState | null,
  formData: FormData
): Promise<LoginActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    callbackUrl: formData.get("callbackUrl") || undefined,
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
      error: "Please correct the errors below.",
    };
  }

  const { email, password, callbackUrl } = validated.data;

  try {
    let defaultRedirect = "/admin";
    try {
      const existingUser = await db.user.findUnique({
        where: { email },
        select: { role: true, mustChangePassword: true },
      });

      if (existingUser?.mustChangePassword) {
        defaultRedirect = "/change-password";
      } else if (existingUser?.role === "SUPER_ADMIN") {
        defaultRedirect = "/superadmin";
      } else if (existingUser?.role === "TEACHER") {
        defaultRedirect = "/teacher";
      } else if (existingUser?.role === "PARENT") {
        defaultRedirect = "/parent";
      } else if (existingUser?.role === "STUDENT") {
        defaultRedirect = "/student";
      }
    } catch {
      // Default to /admin if lookup fails
    }

    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || defaultRedirect,
    });
    return {};
  } catch (err: any) {
    if (err instanceof AuthError || err?.message?.includes("temporarily locked")) {
      return { error: "Invalid credentials or account temporarily locked." };
    }

    // In Next.js, signIn throws a NEXT_REDIRECT error when redirecting
    // We must rethrow redirect errors so Next.js handles navigation
    throw err;
  }
}

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters long"),
    confirmPassword: z.string().min(1, "Password confirmation is required"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });

export interface ChangePasswordState {
  error?: string;
  fieldErrors?: {
    currentPassword?: string[];
    newPassword?: string[];
    confirmPassword?: string[];
  };
  success?: boolean;
}

export async function changePasswordAction(
  prevState: ChangePasswordState | null,
  formData: FormData
): Promise<ChangePasswordState> {
  const sessionUser = await requireUser();

  const rawData = {
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const validated = changePasswordSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      fieldErrors: validated.error.flatten().fieldErrors,
      error: "Please correct the errors below.",
    };
  }

  const { currentPassword, newPassword } = validated.data;

  const user = await db.user.findUnique({
    where: { id: sessionUser.id },
  });

  if (!user || !user.passwordHash) {
    return { error: "User account not found." };
  }

  const isValidCurrent = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValidCurrent) {
    return {
      error: "Current password is incorrect.",
      fieldErrors: { currentPassword: ["Incorrect password"] },
    };
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      mustChangePassword: false,
    },
  });

  return { success: true };
}
