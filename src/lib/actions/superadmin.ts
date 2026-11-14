"use server";

import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/permissions";
import { AcademyPlan, AcademyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

export async function toggleAcademyStatusAction(academyId: string, newStatus: AcademyStatus) {
  await requireSuperAdmin();

  const academy = await db.academy.findUnique({
    where: { id: academyId },
  });

  if (!academy) {
    throw new Error("Academy not found");
  }

  await db.academy.update({
    where: { id: academyId },
    data: { status: newStatus },
  });

  revalidatePath("/superadmin");

  return { success: true, status: newStatus };
}

export async function updateAcademyPlanAction(academyId: string, plan: AcademyPlan) {
  await requireSuperAdmin();

  const academy = await db.academy.findUnique({
    where: { id: academyId },
  });

  if (!academy) {
    throw new Error("Academy not found");
  }

  await db.academy.update({
    where: { id: academyId },
    data: { plan },
  });

  revalidatePath("/superadmin");

  return { success: true, plan };
}
