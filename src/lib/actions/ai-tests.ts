"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { requireAdmin, requireTeacher } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { revalidatePath } from "next/cache";
import { TestStatus, QuestionType } from "@prisma/client";
import {
  generateQuestions,
  generateBoardPaper,
  GenerateQuestionsInput,
  GenerateBoardPaperInput,
  questionDraftSchema,
  QuestionDraft,
} from "@/lib/ai";

const generateInputSchema = z.object({
  subject: z.string().min(1, "Subject is required"),
  topics: z.array(z.string()).min(1, "At least one topic is required"),
  totalMarks: z.number().int().positive("Total marks must be positive"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  mcqCount: z.number().int().min(0).max(20).optional(),
  shortCount: z.number().int().min(0).max(10).optional(),
});

const generateBoardInputSchema = z.object({
  boardName: z.string().min(1, "Board name is required"),
  className: z.string().min(1, "Class is required"),
  subject: z.string().min(1, "Subject is required"),
  chapters: z
    .array(
      z.object({
        number: z.number().int(),
        title: z.string(),
      })
    )
    .min(1, "Select at least one chapter"),
  scheme: z.object({
    id: z.string(),
    structure: z.any(),
    totalMarks: z.number(),
    timeMinutes: z.number(),
    verified: z.boolean(),
  }),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

const saveDraftSchema = z.object({
  batchId: z.string().min(1, "Batch is required"),
  subject: z.string().min(1, "Subject is required"),
  title: z.string().min(1, "Test title is required"),
  totalMarks: z.number().positive("Total marks must be positive"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format").optional(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  negativeMarking: z.number().min(0).optional().default(0),
  schemeId: z.string().optional().nullable(),
  questions: z.array(questionDraftSchema).min(1, "Paper must contain at least one question"),
});

export type SaveDraftGeneratedTestInput = z.infer<typeof saveDraftSchema>;

/**
 * Server action to generate test questions using official board pairing scheme
 */
export async function generateBoardPaperAction(input: GenerateBoardPaperInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validated = generateBoardInputSchema.parse(input);
  const result = await generateBoardPaper(validated as GenerateBoardPaperInput);

  return result;
}

/**
 * Server action to generate test questions using LLM with deterministic syllabus fallback
 */
export async function generatePaperDraftAction(input: GenerateQuestionsInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  const validated = generateInputSchema.parse(input);
  const result = await generateQuestions(validated);

  return result;
}

/**
 * Server action to save reviewed and edited questions as a DRAFT Test in DB
 */
export async function saveDraftGeneratedTestAction(input: SaveDraftGeneratedTestInput) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const tenant = await requireTenant();

  const validated = saveDraftSchema.parse(input);
  const {
    batchId,
    subject,
    title,
    totalMarks,
    date,
    durationMinutes,
    negativeMarking,
    schemeId,
    questions,
  } = validated;

  const batch = await db.batch.findFirst({
    where: { id: batchId, academyId: tenant.academyId },
  });

  if (!batch) {
    throw new Error("Batch not found.");
  }

  // Teacher authorization check: teacher must be assigned to batch
  if (session.user.role === "TEACHER") {
    const teacher = await requireTeacher();
    if (batch.teacherId !== teacher.id) {
      throw new Error("Forbidden: You can only create tests for your assigned batches.");
    }
  } else if (session.user.role !== "ADMIN" && (session.user.role as string) !== "SUPER_ADMIN") {
    throw new Error("Forbidden");
  }

  const testDate = date
    ? new Date(`${date}T00:00:00.000Z`)
    : new Date();

  // Create Test and Questions in a transaction
  const createdTest = await db.$transaction(async (tx) => {
    const test = await tx.test.create({
      data: {
        academyId: tenant.academyId,
        batchId,
        subject,
        title,
        totalMarks: Math.round(totalMarks),
        date: testDate,
        status: TestStatus.DRAFT,
        durationMinutes: durationMinutes ?? null,
        negativeMarking: negativeMarking ?? 0,
        shuffleQuestions: false,
        schemeId: schemeId || undefined,
      },
    });

    const questionRows = questions.map((q, idx) => ({
      academyId: tenant.academyId,
      testId: test.id,
      type:
        q.type === "LONG"
          ? QuestionType.LONG
          : q.type === "SHORT"
          ? QuestionType.SHORT
          : QuestionType.MCQ,
      text: q.text,
      options: q.options && q.options.length > 0 ? (q.options as any) : undefined,
      correctAnswer: q.correctAnswer,
      marks: q.marks,
      order: idx + 1,
    }));

    await tx.question.createMany({
      data: questionRows,
    });

    return test;
  });

  revalidatePath("/teacher/tests");
  revalidatePath("/admin/results");

  return {
    success: true,
    testId: createdTest.id,
    title: createdTest.title,
  };
}
