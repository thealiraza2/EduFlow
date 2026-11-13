"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
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
    await signIn("credentials", {
      email,
      password,
      redirectTo: callbackUrl || "/admin",
    });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password. Please check your credentials." };
        default:
          return { error: "Authentication failed. Please try again." };
      }
    }

    // In Next.js, signIn throws a NEXT_REDIRECT error when redirecting
    // We must rethrow redirect errors so Next.js handles navigation
    throw err;
  }
}
