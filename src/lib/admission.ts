/**
 * EduFlow - Admission Number Generator
 * INVARIANT: Sequential, year-scoped, never reused within an academy (e.g. EF-2026-0001)
 */

import { Prisma } from "@prisma/client";

export async function generateNextAdmissionNumber(
  tx: Prisma.TransactionClient,
  year: number = new Date().getFullYear(),
  academyId?: string
): Promise<string> {
  const prefix = `EF-${year}-`;

  const whereClause: Prisma.StudentWhereInput = {
    admissionNo: {
      startsWith: prefix,
    },
    ...(academyId ? { academyId } : {}),
  };

  // Find the highest admission number issued in the specified year for this academy
  const lastStudent = await tx.student.findFirst({
    where: whereClause,
    orderBy: {
      admissionNo: "desc",
    },
    select: {
      admissionNo: true,
    },
  });

  let nextSequence = 1;

  if (lastStudent?.admissionNo) {
    const parts = lastStudent.admissionNo.split("-");
    if (parts.length === 3) {
      const parsedNum = parseInt(parts[2], 10);
      if (!isNaN(parsedNum)) {
        nextSequence = parsedNum + 1;
      }
    }
  }

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
