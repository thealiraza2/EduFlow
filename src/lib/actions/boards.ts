"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";

const createBoardSchema = z.object({
  name: z.string().min(2, "Board name must be at least 2 characters"),
  province: z.string().min(2, "Province is required"),
});

const createSubjectSchema = z.object({
  boardId: z.string().min(1, "Board is required"),
  className: z.string().min(1, "Class name is required"),
  name: z.string().min(2, "Subject name must be at least 2 characters"),
});

const createChapterSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  number: z.number().int().positive("Chapter number must be positive"),
  title: z.string().min(2, "Chapter title is required"),
});

const saveSchemeSchema = z.object({
  boardId: z.string().min(1, "Board is required"),
  className: z.string().min(1, "Class is required"),
  subjectId: z.string().min(1, "Subject is required"),
  mcqCount: z.number().int().min(0),
  mcqMarks: z.number().positive(),
  shortCount: z.number().int().min(0),
  shortMarks: z.number().positive(),
  shortAttempt: z.number().int().min(0).optional(),
  longCount: z.number().int().min(0),
  longMarks: z.number().positive(),
  longAttempt: z.number().int().min(0).optional(),
  totalMarks: z.number().int().positive("Total marks must be positive"),
  timeMinutes: z.number().int().positive("Time must be positive"),
  sourceUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export async function createBoardAction(input: z.infer<typeof createBoardSchema>) {
  await requireAdmin();
  const validated = createBoardSchema.parse(input);

  const board = await db.board.create({
    data: {
      name: validated.name.trim(),
      province: validated.province.trim(),
    },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true, board };
}

export async function deleteBoardAction(boardId: string) {
  await requireAdmin();

  // Cascade delete handles subjects, chapters, schemes
  await db.board.delete({
    where: { id: boardId },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true };
}

export async function createSubjectAction(input: z.infer<typeof createSubjectSchema>) {
  await requireAdmin();
  const validated = createSubjectSchema.parse(input);

  const subject = await db.subject.create({
    data: {
      boardId: validated.boardId,
      className: validated.className.trim(),
      name: validated.name.trim(),
    },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true, subject };
}

export async function deleteSubjectAction(subjectId: string) {
  await requireAdmin();

  await db.subject.delete({
    where: { id: subjectId },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true };
}

export async function createChapterAction(input: z.infer<typeof createChapterSchema>) {
  await requireAdmin();
  const validated = createChapterSchema.parse(input);

  const chapter = await db.chapter.create({
    data: {
      subjectId: validated.subjectId,
      number: validated.number,
      title: validated.title.trim(),
    },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true, chapter };
}

export async function deleteChapterAction(chapterId: string) {
  await requireAdmin();

  await db.chapter.delete({
    where: { id: chapterId },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true };
}

export async function savePaperSchemeAction(input: z.infer<typeof saveSchemeSchema>) {
  await requireAdmin();
  const val = saveSchemeSchema.parse(input);

  const structure = {
    mcq: {
      count: val.mcqCount,
      marksEach: val.mcqMarks,
    },
    short: {
      count: val.shortCount,
      marksEach: val.shortMarks,
      attempt: val.shortAttempt ?? val.shortCount,
    },
    long: {
      count: val.longCount,
      marksEach: val.longMarks,
      attempt: val.longAttempt ?? val.longCount,
    },
  };

  const scheme = await db.paperScheme.upsert({
    where: {
      boardId_className_subjectId: {
        boardId: val.boardId,
        className: val.className,
        subjectId: val.subjectId,
      },
    },
    update: {
      structure,
      totalMarks: val.totalMarks,
      timeMinutes: val.timeMinutes,
      sourceUrl: val.sourceUrl && val.sourceUrl.trim() ? val.sourceUrl.trim() : null,
    },
    create: {
      boardId: val.boardId,
      className: val.className,
      subjectId: val.subjectId,
      structure,
      totalMarks: val.totalMarks,
      timeMinutes: val.timeMinutes,
      sourceUrl: val.sourceUrl && val.sourceUrl.trim() ? val.sourceUrl.trim() : null,
      verified: false,
    },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true, scheme };
}

export async function verifyPaperSchemeAction(schemeId: string, verified: boolean) {
  await requireAdmin();

  const scheme = await db.paperScheme.update({
    where: { id: schemeId },
    data: {
      verified,
      verifiedAt: verified ? new Date() : null,
    },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true, verified: scheme.verified };
}

export async function deletePaperSchemeAction(schemeId: string) {
  await requireAdmin();

  // Rule: A scheme with generated papers cannot be deleted, only unverified.
  const testsCount = await db.test.count({
    where: { schemeId },
  });

  if (testsCount > 0) {
    throw new Error(
      `This pairing scheme has ${testsCount} generated test paper(s) associated with it and cannot be deleted. You can mark it unverified instead.`
    );
  }

  await db.paperScheme.delete({
    where: { id: schemeId },
  });

  revalidatePath("/admin/boards");
  revalidatePath("/teacher/tests/generate");
  return { success: true };
}
