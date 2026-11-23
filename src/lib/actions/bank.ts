"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { BankQuestionSource, BankQuestionType, ContentStatus, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/permissions";
import { parseQuestionCsv } from "@/lib/bank/csv";

type Result<T = unknown> = { ok: true; data?: T } | { ok: false; error: string };

const fail = (e: unknown): { ok: false; error: string } => ({
  ok: false,
  error: e instanceof z.ZodError ? e.issues[0]?.message ?? "Invalid input" : e instanceof Error ? e.message : "Something went wrong",
});

const bookPath = (bookId: string) => `/superadmin/bank/${bookId}`;

/* ───────────────────────── Books ───────────────────────── */

const bookSchema = z.object({
  authorityId: z.string().min(1),
  className: z.enum(["9", "10", "11", "12"]),
  subject: z.string().trim().min(2, "Subject is required").max(60),
  subjectUr: z.string().trim().max(60).optional(),
  edition: z.string().trim().min(2, "Edition is required").max(80),
  sessionFrom: z.coerce.number().int().min(2015).max(2100),
  sourceUrl: z.string().trim().url("Source must be a full link").optional().or(z.literal("")),
});

export async function createBookAction(input: z.input<typeof bookSchema>): Promise<Result<{ id: string }>> {
  try {
    await requireSuperAdmin();
    const d = bookSchema.parse(input);
    const book = await db.$transaction(async (tx) => {
      // only one current edition per authority + class + subject
      await tx.book.updateMany({ where: { authorityId: d.authorityId, className: d.className, subject: d.subject }, data: { isCurrent: false } });
      return tx.book.create({
        data: { ...d, subjectUr: d.subjectUr || null, sourceUrl: d.sourceUrl || null, isCurrent: true },
      });
    });
    revalidatePath("/superadmin/bank");
    return { ok: true, data: { id: book.id } };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: false, error: "This edition of the book already exists." };
    return fail(e);
  }
}

export async function setBookCurrentAction(bookId: string): Promise<Result> {
  try {
    await requireSuperAdmin();
    const book = await db.book.findUniqueOrThrow({ where: { id: bookId } });
    await db.$transaction([
      db.book.updateMany({ where: { authorityId: book.authorityId, className: book.className, subject: book.subject }, data: { isCurrent: false } }),
      db.book.update({ where: { id: bookId }, data: { isCurrent: true } }),
    ]);
    revalidatePath("/superadmin/bank");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────────────────── Units & topics ───────────────────────── */

const unitSchema = z.object({
  bookId: z.string().min(1),
  number: z.coerce.number().int().min(1).max(60),
  title: z.string().trim().min(2, "Unit title is required").max(160),
  titleUr: z.string().trim().max(160).optional(),
});

export async function upsertUnitAction(input: z.input<typeof unitSchema>): Promise<Result> {
  try {
    await requireSuperAdmin();
    const d = unitSchema.parse(input);
    await db.bookUnit.upsert({
      where: { bookId_number: { bookId: d.bookId, number: d.number } },
      create: { bookId: d.bookId, number: d.number, title: d.title, titleUr: d.titleUr || null },
      update: { title: d.title, titleUr: d.titleUr || null },
    });
    revalidatePath(bookPath(d.bookId));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

const topicSchema = z.object({
  unitId: z.string().min(1),
  code: z.string().trim().min(1, "Topic number is required").max(12),
  title: z.string().trim().min(2, "Topic title is required").max(200),
  titleUr: z.string().trim().max(200).optional(),
});

export async function upsertTopicAction(input: z.input<typeof topicSchema>): Promise<Result> {
  try {
    await requireSuperAdmin();
    const d = topicSchema.parse(input);
    const unit = await db.bookUnit.findUniqueOrThrow({ where: { id: d.unitId } });
    const order = Number.parseFloat(d.code.split(".").pop() ?? "0") || 0;
    await db.bookTopic.upsert({
      where: { unitId_code: { unitId: d.unitId, code: d.code } },
      create: { unitId: d.unitId, code: d.code, title: d.title, titleUr: d.titleUr || null, order },
      update: { title: d.title, titleUr: d.titleUr || null },
    });
    revalidatePath(bookPath(unit.bookId));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteUnitAction(unitId: string): Promise<Result> {
  try {
    await requireSuperAdmin();
    const unit = await db.bookUnit.findUniqueOrThrow({ where: { id: unitId }, include: { _count: { select: { questions: true } } } });
    if (unit._count.questions > 0) return { ok: false, error: `Unit ${unit.number} still has ${unit._count.questions} questions. Delete those first.` };
    await db.bookUnit.delete({ where: { id: unitId } });
    revalidatePath(bookPath(unit.bookId));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────────────────── CSV import ───────────────────────── */

export async function importQuestionsAction(bookId: string, csvText: string): Promise<Result<{ created: number; units: number; topics: number }> & { errors?: { line: number; message: string }[] }> {
  try {
    const user = await requireSuperAdmin();
    if (csvText.length > 6_000_000) return { ok: false, error: "File is too large. Split it into smaller files (up to 3,000 questions each)." };
    const { rows, errors } = parseQuestionCsv(csvText);
    if (errors.length) return { ok: false, error: `${errors.length} row(s) have problems. Nothing was imported.`, errors: errors.slice(0, 50) };
    if (rows.length === 0) return { ok: false, error: "No questions found in the file." };

    const book = await db.book.findUniqueOrThrow({ where: { id: bookId }, include: { units: { include: { topics: true } } } });
    const unitByNumber = new Map(book.units.map((u) => [u.number, u]));

    // units referenced but missing: need a unit_title to create them
    const missing = [...new Set(rows.map((r) => r.unitNumber))].filter((n) => !unitByNumber.has(n));
    const noTitle = missing.filter((n) => !rows.find((r) => r.unitNumber === n && r.unitTitle));
    if (noTitle.length) return { ok: false, error: `Unit ${noTitle.join(", ")} does not exist in this book. Add it first, or fill unit_title in the file.` };

    const result = await db.$transaction(async (tx) => {
      let newUnits = 0, newTopics = 0;
      for (const n of missing) {
        const title = rows.find((r) => r.unitNumber === n && r.unitTitle)!.unitTitle!;
        const u = await tx.bookUnit.create({ data: { bookId, number: n, title }, include: { topics: true } });
        unitByNumber.set(n, u);
        newUnits++;
      }
      const topicKey = (unitId: string, code: string) => `${unitId}|${code}`;
      const topics = new Map<string, string>();
      for (const u of unitByNumber.values()) for (const t of u.topics) topics.set(topicKey(u.id, t.code), t.id);
      for (const r of rows) {
        if (!r.topicCode) continue;
        const unit = unitByNumber.get(r.unitNumber)!;
        const key = topicKey(unit.id, r.topicCode);
        if (topics.has(key)) continue;
        const t = await tx.bookTopic.create({
          data: { unitId: unit.id, code: r.topicCode, title: r.topicTitle || `Topic ${r.topicCode}`, order: Number.parseFloat(r.topicCode.split(".").pop() ?? "0") || 0 },
        });
        topics.set(key, t.id);
        newTopics++;
      }
      const created = await tx.bankQuestion.createMany({
        data: rows.map((r) => {
          const unit = unitByNumber.get(r.unitNumber)!;
          return {
            bookId,
            unitId: unit.id,
            topicId: r.topicCode ? topics.get(topicKey(unit.id, r.topicCode)) ?? null : null,
            type: r.type as BankQuestionType,
            source: r.source as BankQuestionSource,
            textEn: r.textEn ?? null,
            textUr: r.textUr ?? null,
            options: r.options ?? Prisma.JsonNull,
            answer: r.answer ?? null,
            marks: r.marks,
            pastPaperRef: r.pastPaperRef ?? null,
            status: ContentStatus.DRAFT,
            createdById: user.id,
          };
        }),
      });
      return { created: created.count, units: newUnits, topics: newTopics };
    }, { timeout: 60_000 });

    revalidatePath(bookPath(bookId));
    revalidatePath("/superadmin/bank");
    return { ok: true, data: result };
  } catch (e) {
    return fail(e);
  }
}

/* ───────────────────────── Review & edit ───────────────────────── */

export async function setQuestionStatusAction(ids: string[], status: "DRAFT" | "REVIEWED"): Promise<Result<{ count: number }>> {
  try {
    await requireSuperAdmin();
    const list = z.array(z.string().min(1)).min(1).max(500).parse(ids);
    const res = await db.bankQuestion.updateMany({ where: { id: { in: list } }, data: { status: status as ContentStatus } });
    const first = await db.bankQuestion.findFirst({ where: { id: list[0] }, select: { bookId: true } });
    if (first) revalidatePath(bookPath(first.bookId));
    revalidatePath("/superadmin/bank");
    return { ok: true, data: { count: res.count } };
  } catch (e) {
    return fail(e);
  }
}

const editSchema = z.object({
  id: z.string().min(1),
  textEn: z.string().trim().max(4000).optional(),
  textUr: z.string().trim().max(4000).optional(),
  options: z.array(z.object({ en: z.string().trim().max(500), ur: z.string().trim().max(500) })).length(4).optional(),
  answer: z.string().trim().max(4000).optional(),
  marks: z.coerce.number().positive().max(50),
});

export async function updateQuestionAction(input: z.input<typeof editSchema>): Promise<Result> {
  try {
    await requireSuperAdmin();
    const d = editSchema.parse(input);
    if (!d.textEn && !d.textUr) return { ok: false, error: "The question needs English or Urdu text." };
    const q = await db.bankQuestion.findUniqueOrThrow({ where: { id: d.id } });
    if (q.type === "MCQ") {
      if (!d.options || d.options.some((o) => !o.en && !o.ur)) return { ok: false, error: "All four options need text." };
      if (!["0", "1", "2", "3"].includes(d.answer ?? "")) return { ok: false, error: "Pick the correct option." };
    }
    await db.bankQuestion.update({
      where: { id: d.id },
      data: {
        textEn: d.textEn || null,
        textUr: d.textUr || null,
        options: q.type === "MCQ" ? d.options : Prisma.JsonNull,
        answer: d.answer || null,
        marks: d.marks,
      },
    });
    revalidatePath(bookPath(q.bookId));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteQuestionsAction(ids: string[]): Promise<Result<{ count: number }>> {
  try {
    await requireSuperAdmin();
    const list = z.array(z.string().min(1)).min(1).max(500).parse(ids);
    const first = await db.bankQuestion.findFirst({ where: { id: list[0] }, select: { bookId: true } });
    const res = await db.bankQuestion.deleteMany({ where: { id: { in: list } } });
    if (first) revalidatePath(bookPath(first.bookId));
    revalidatePath("/superadmin/bank");
    return { ok: true, data: { count: res.count } };
  } catch (e) {
    return fail(e);
  }
}
