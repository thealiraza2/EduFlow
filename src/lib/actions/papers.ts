"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { buildSections, DEFAULT_SETTINGS, paperMarks, pickSpread, type PaperSection, type PaperSettings } from "@/lib/bank/paper";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };
const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : e instanceof Error ? e.message : "Something went wrong",
});

async function context() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN]);
  const tenant = await requireTenant();
  return { user, academyId: tenant.academyId };
}

const TYPES = ["MCQ", "SHORT", "LONG"] as const;
const SOURCES = ["EXERCISE", "PAST_PAPER", "ADDITIONAL", "CONCEPTUAL"] as const;

const generateSchema = z.object({
  bookId: z.string().min(1, "Choose a book"),
  unitIds: z.array(z.string().min(1)).min(1, "Choose at least one chapter"),
  topicIds: z.array(z.string().min(1)).optional(),
  sources: z.array(z.enum(SOURCES)).min(1, "Choose at least one question source"),
  title: z.string().trim().min(2, "Give the paper a title").max(120),
  timeMinutes: z.coerce.number().int().min(5).max(300).optional(),
  language: z.enum(["en", "ur", "dual"]),
  sections: z
    .array(z.object({
      type: z.enum(TYPES),
      total: z.coerce.number().int().min(1).max(60),
      required: z.coerce.number().int().min(1).max(60),
      marksEach: z.coerce.number().min(0.5).max(30),
    }))
    .min(1, "Add at least one section")
    .max(8),
});

/** Candidate questions: reviewed only, current scope, chosen sources. */
async function candidates(bookId: string, unitIds: string[], topicIds: string[] | undefined, sources: string[]) {
  return db.bankQuestion.findMany({
    where: {
      bookId,
      unitId: { in: unitIds },
      ...(topicIds?.length ? { topicId: { in: topicIds } } : {}),
      source: { in: sources as (typeof SOURCES)[number][] },
      status: "REVIEWED",
    },
    select: { id: true, type: true, unitId: true },
  });
}

export async function generatePaperAction(input: z.input<typeof generateSchema>): Promise<Result<{ id: string; shortfalls: { type: string; wanted: number; found: number }[] }>> {
  try {
    const { user, academyId } = await context();
    const d = generateSchema.parse(input);
    for (const s of d.sections) if (s.required > s.total) return { ok: false, error: `${s.type}: students cannot attempt more questions than you print.` };

    const book = await db.book.findUniqueOrThrow({ where: { id: d.bookId } });
    const pool = await candidates(d.bookId, d.unitIds, d.topicIds, d.sources);
    const { sections, shortfalls } = buildSections(d.sections, pool);
    if (sections.every((s) => s.questionIds.length === 0)) {
      return { ok: false, error: "No reviewed questions match these chapters yet. Try more chapters or sources." };
    }

    const settings: PaperSettings & { scope: { unitIds: string[]; topicIds?: string[]; sources: string[] } } = {
      ...DEFAULT_SETTINGS,
      examTitle: d.title,
      scope: { unitIds: d.unitIds, topicIds: d.topicIds, sources: d.sources },
    };
    const paper = await db.savedPaper.create({
      data: {
        academyId,
        createdById: user.id,
        bookId: book.id,
        title: d.title,
        className: book.className,
        subject: book.subject,
        totalMarks: paperMarks(sections),
        timeMinutes: d.timeMinutes ?? null,
        language: d.language,
        sections: sections as unknown as object,
        settings: settings as unknown as object,
      },
    });
    revalidatePath("/teacher/papers");
    return { ok: true, data: { id: paper.id, shortfalls } };
  } catch (e) {
    return fail(e);
  }
}

async function ownPaper(id: string, academyId: string) {
  const paper = await db.savedPaper.findFirst({ where: { id, academyId } });
  if (!paper) throw new Error("Paper not found");
  return paper;
}

const saveSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(2).max(120),
  timeMinutes: z.coerce.number().int().min(5).max(300).nullable(),
  language: z.enum(["en", "ur", "dual"]),
  sections: z.array(z.object({
    id: z.string(),
    type: z.enum(TYPES),
    required: z.number().int().min(0).max(60),
    marksEach: z.number().min(0.5).max(30),
    questionIds: z.array(z.string()).max(60),
  })).max(8),
  settings: z.object({
    schoolName: z.string().max(120),
    examTitle: z.string().max(120),
    showAnswerKey: z.boolean(),
    fontScale: z.number().min(0.8).max(1.3),
  }).passthrough(),
});

export async function savePaperAction(input: z.input<typeof saveSchema>): Promise<Result> {
  try {
    const { academyId } = await context();
    const d = saveSchema.parse(input);
    await ownPaper(d.id, academyId);
    for (const s of d.sections) if (s.required > s.questionIds.length) return { ok: false, error: "A section asks students to attempt more questions than it has." };
    await db.savedPaper.update({
      where: { id: d.id },
      data: {
        title: d.title,
        timeMinutes: d.timeMinutes,
        language: d.language,
        totalMarks: paperMarks(d.sections),
        sections: d.sections as unknown as object,
        settings: d.settings as unknown as object,
      },
    });
    revalidatePath(`/teacher/papers/${d.id}`);
    revalidatePath("/teacher/papers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** New question(s) for one section, keeping everything already on the paper unique. */
type FreshQuestion = {
  id: string; type: "MCQ" | "SHORT" | "LONG"; textEn: string | null; textUr: string | null;
  options: { en: string; ur: string }[] | null; answer: string | null;
};

export async function replaceQuestionsAction(input: { paperId: string; sectionId: string; replaceIds: string[]; keepIds: string[] }): Promise<Result<{ questions: FreshQuestion[] }>> {
  try {
    const { academyId } = await context();
    const paper = await ownPaper(input.paperId, academyId);
    const sections = paper.sections as unknown as PaperSection[];
    const section = sections.find((s) => s.id === input.sectionId);
    if (!section || !paper.bookId) return { ok: false, error: "Section not found" };
    const scope = (paper.settings as { scope?: { unitIds: string[]; topicIds?: string[]; sources: string[] } }).scope;
    if (!scope) return { ok: false, error: "This paper has no saved chapter scope." };
    const pool = (await candidates(paper.bookId, scope.unitIds, scope.topicIds, scope.sources)).filter((q) => q.type === section.type);
    const exclude = new Set([...input.keepIds, ...input.replaceIds]);
    const ids = pickSpread(pool, input.replaceIds.length, exclude);
    if (ids.length === 0) return { ok: false, error: "No other reviewed questions are left in these chapters." };
    const rows = await db.bankQuestion.findMany({
      where: { id: { in: ids } },
      select: { id: true, type: true, textEn: true, textUr: true, options: true, answer: true },
    });
    const byId = new Map(rows.map((q) => [q.id, q]));
    const questions = ids.map((id) => byId.get(id)!).filter(Boolean).map((q) => ({ ...q, options: (q.options as FreshQuestion["options"]) ?? null }));
    return { ok: true, data: { questions } };
  } catch (e) {
    return fail(e);
  }
}

export async function deletePaperAction(id: string): Promise<Result> {
  try {
    const { academyId } = await context();
    await ownPaper(id, academyId);
    await db.savedPaper.delete({ where: { id } });
    revalidatePath("/teacher/papers");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
