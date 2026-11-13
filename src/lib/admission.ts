/**
 * AcademyHub - Admission Number Generator
 * INVARIANT: Sequential, year-scoped, never reused (e.g. AH-2026-0001)
 */

import { Prisma } from "@prisma/client";

export async function generateNextAdmissionNumber(
  tx: Prisma.TransactionClient,
  year: number = new Date().getFullYear()
): Promise<string> {
  const prefix = `AH-${year}-`;

  // Find the highest admission number issued in the specified year
  const lastStudent = await tx.student.findFirst({
    where: {
      admissionNo: {
        startsWith: prefix,
      },
    },
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
