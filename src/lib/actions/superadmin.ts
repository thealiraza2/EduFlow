"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { AcademyPlan, AcademyStatus, AnnouncementAudience, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/permissions";
import { SUPER_ADMIN_ACADEMY_COOKIE } from "@/lib/tenant";

const RESERVED_SLUGS = new Set([
  "api", "admin", "superadmin", "app", "www", "login", "signup", "platform",
  "root", "test", "support", "help", "dashboard", "billing",
]);

/** Readable temporary password, e.g. "Kite-7h3Qx9-Lamp". Shown once to the super admin. */
function generateTempPassword(): string {
  const words = ["Kite", "Lamp", "River", "Cedar", "Maple", "Falcon", "Indus", "Saffron", "Orbit", "Harbor"];
  const pick = () => words[crypto.randomInt(words.length)];
  return `${pick()}-${crypto.randomBytes(5).toString("base64url")}-${pick()}`;
}

function revalidateConsole(academyId?: string) {
  revalidatePath("/superadmin");
  if (academyId) revalidatePath(`/superadmin/academies/${academyId}`);
}

/* ───────────────────────── Existing: status & plan ───────────────────────── */

export async function toggleAcademyStatusAction(academyId: string, newStatus: AcademyStatus) {
  await requireSuperAdmin();
  const academy = await db.academy.findUnique({ where: { id: academyId } });
  if (!academy) throw new Error("Academy not found");
  await db.academy.update({ where: { id: academyId }, data: { status: newStatus } });
  revalidateConsole(academyId);
  return { success: true, status: newStatus };
}

export async function updateAcademyPlanAction(academyId: string, plan: AcademyPlan) {
  await requireSuperAdmin();
  const academy = await db.academy.findUnique({ where: { id: academyId } });
  if (!academy) throw new Error("Academy not found");
  await db.academy.update({ where: { id: academyId }, data: { plan } });
  revalidateConsole(academyId);
  return { success: true, plan };
}

/* ───────────────────────── 1. Open any academy as admin ───────────────────────── */

export async function openAcademyAsAdminAction(academyId: string) {
  await requireSuperAdmin();
  const academy = await db.academy.findUnique({ where: { id: academyId }, select: { id: true } });
  if (!academy) throw new Error("Academy not found");
  cookies().set(SUPER_ADMIN_ACADEMY_COOKIE, academy.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // one working day
  });
  redirect("/admin");
}

export async function exitAcademyViewAction() {
  await requireSuperAdmin();
  cookies().delete(SUPER_ADMIN_ACADEMY_COOKIE);
  redirect("/superadmin");
}

/* ───────────────────────── 2. Create an academy ───────────────────────── */

const createAcademySchema = z.object({
  academyName: z.string().trim().min(3, "Academy name must be at least 3 characters"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Web address must be at least 3 characters")
    .max(30, "Web address must be at most 30 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens only"),
  adminName: z.string().trim().min(2, "Admin name is required"),
  adminEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  adminPhone: z.string().trim().optional(),
  plan: z.nativeEnum(AcademyPlan),
  trialDays: z.coerce.number().int().min(0).max(90),
});

export type ActionResult<T = unknown> =
  | ({ success: true } & T)
  | { success: false; error: string };

export async function createAcademyAction(
  input: z.input<typeof createAcademySchema>
): Promise<ActionResult<{ academyId: string; adminEmail: string; tempPassword: string }>> {
  await requireSuperAdmin();
  const parsed = createAcademySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  const { academyName, slug, adminName, adminEmail, adminPhone, plan, trialDays } = parsed.data;

  if (RESERVED_SLUGS.has(slug)) return { success: false, error: `"${slug}" is reserved. Choose another web address.` };
  if (await db.academy.findUnique({ where: { slug } }))
    return { success: false, error: `"${slug}" is already taken.` };
  if (await db.user.findUnique({ where: { email: adminEmail } }))
    return { success: false, error: "A user with this email already exists." };

  const tempPassword = generateTempPassword();
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const academy = await db.$transaction(async (tx) => {
    const a = await tx.academy.create({
      data: {
        name: academyName,
        slug,
        subdomain: slug,
        plan,
        status: AcademyStatus.ACTIVE,
        trialEndsAt: trialDays > 0 ? new Date(Date.now() + trialDays * 86400000) : null,
      },
    });
    await tx.user.create({
      data: {
        academyId: a.id,
        name: adminName,
        email: adminEmail,
        phone: adminPhone || null,
        role: Role.ADMIN,
        passwordHash,
        mustChangePassword: true,
      },
    });
    return a;
  });

  revalidateConsole();
  return { success: true, academyId: academy.id, adminEmail, tempPassword };
}

/* ───────────────────────── 3. Trial control ───────────────────────── */

export async function setAcademyTrialAction(
  academyId: string,
  mode: "extend" | "end" | "set",
  value?: number | string
): Promise<ActionResult<{ trialEndsAt: string | null }>> {
  await requireSuperAdmin();
  const academy = await db.academy.findUnique({ where: { id: academyId } });
  if (!academy) return { success: false, error: "Academy not found" };

  let trialEndsAt: Date | null;
  if (mode === "end") {
    trialEndsAt = null;
  } else if (mode === "extend") {
    const days = Number(value);
    if (!Number.isInteger(days) || days < 1 || days > 90) return { success: false, error: "Extend by 1–90 days." };
    const base = academy.trialEndsAt && academy.trialEndsAt > new Date() ? academy.trialEndsAt : new Date();
    trialEndsAt = new Date(base.getTime() + days * 86400000);
  } else {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return { success: false, error: "Pick a valid date." };
    if (d < new Date()) return { success: false, error: "The trial end date must be in the future." };
    trialEndsAt = d;
  }

  await db.academy.update({ where: { id: academyId }, data: { trialEndsAt } });
  revalidateConsole(academyId);
  return { success: true, trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null };
}

/* ───────────────────────── 4. Users: reset password, add admin ───────────────────────── */

export async function resetUserPasswordAction(
  userId: string
): Promise<ActionResult<{ email: string; tempPassword: string }>> {
  const me = await requireSuperAdmin();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { success: false, error: "User not found" };
  if (user.role === Role.SUPER_ADMIN && user.id !== me.id)
    return { success: false, error: "Another super admin's password can't be reset here." };

  const tempPassword = generateTempPassword();
  await db.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(tempPassword, 10), mustChangePassword: true },
  });
  if (user.academyId) revalidateConsole(user.academyId);
  return { success: true, email: user.email, tempPassword };
}

const addAdminSchema = z.object({
  academyId: z.string().min(1),
  name: z.string().trim().min(2, "Name is required"),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  phone: z.string().trim().optional(),
});

export async function addAcademyAdminAction(
  input: z.input<typeof addAdminSchema>
): Promise<ActionResult<{ email: string; tempPassword: string }>> {
  await requireSuperAdmin();
  const parsed = addAdminSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  const { academyId, name, email, phone } = parsed.data;

  if (!(await db.academy.findUnique({ where: { id: academyId } }))) return { success: false, error: "Academy not found" };
  if (await db.user.findUnique({ where: { email } })) return { success: false, error: "A user with this email already exists." };

  const tempPassword = generateTempPassword();
  await db.user.create({
    data: {
      academyId,
      name,
      email,
      phone: phone || null,
      role: Role.ADMIN,
      passwordHash: await bcrypt.hash(tempPassword, 10),
      mustChangePassword: true,
    },
  });
  revalidateConsole(academyId);
  return { success: true, email, tempPassword };
}

/* ───────────────────────── 5. Contact inbox ───────────────────────── */

export async function deleteContactSubmissionAction(id: string): Promise<ActionResult> {
  await requireSuperAdmin();
  await db.contactSubmission.delete({ where: { id } }).catch(() => null);
  revalidatePath("/superadmin/inbox");
  return { success: true };
}

/* ───────────────────────── 7. Delete academy ───────────────────────── */

export async function deleteAcademyAction(academyId: string, confirmSlug: string): Promise<ActionResult> {
  await requireSuperAdmin();
  const academy = await db.academy.findUnique({ where: { id: academyId } });
  if (!academy) return { success: false, error: "Academy not found" };
  if (confirmSlug.trim().toLowerCase() !== academy.slug)
    return { success: false, error: `Type "${academy.slug}" exactly to confirm.` };

  // All tenant data cascades from Academy (see schema onDelete: Cascade).
  await db.academy.delete({ where: { id: academyId } });
  if (cookies().get(SUPER_ADMIN_ACADEMY_COOKIE)?.value === academyId) cookies().delete(SUPER_ADMIN_ACADEMY_COOKIE);
  revalidateConsole();
  return { success: true };
}

/* ───────────────────────── 8. Platform announcement ───────────────────────── */

const announcementSchema = z.object({
  title: z.string().trim().min(3, "Title is required").max(120),
  content: z.string().trim().min(5, "Message is required").max(2000),
  audience: z.nativeEnum(AnnouncementAudience),
  target: z.enum(["all", "active", "trial"]),
});

export async function sendPlatformAnnouncementAction(
  input: z.input<typeof announcementSchema>
): Promise<ActionResult<{ count: number }>> {
  await requireSuperAdmin();
  const parsed = announcementSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.errors[0]?.message || "Invalid input" };
  const { title, content, audience, target } = parsed.data;

  const now = new Date();
  const academies = await db.academy.findMany({
    where:
      target === "active"
        ? { status: AcademyStatus.ACTIVE }
        : target === "trial"
          ? { status: AcademyStatus.ACTIVE, trialEndsAt: { gt: now } }
          : {},
    select: { id: true },
  });
  if (academies.length === 0) return { success: false, error: "No academies match this audience." };

  await db.announcement.createMany({
    data: academies.map((a) => ({ academyId: a.id, title, content, audience })),
  });
  revalidatePath("/superadmin/announcements");
  return { success: true, count: academies.length };
}
