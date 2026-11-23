import Link from "next/link";
import { notFound } from "next/navigation";
import { Prisma } from "@prisma/client";
import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsolePageHeader, ConsoleSection } from "@/components/superadmin/ConsoleUI";
import { ImportPanel, QuestionTable, UnitEditor, type AdminQuestion } from "@/components/bank/BankAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Book | Question bank" };

const PAGE = 40;

export default async function BookPage({
  params,
  searchParams,
}: {
  params: { bookId: string };
  searchParams: { unit?: string; type?: string; status?: string; page?: string };
}) {
  await requireSuperAdmin();
  const book = await db.book.findUnique({
    where: { id: params.bookId },
    include: {
      authority: { select: { code: true } },
      units: {
        orderBy: { number: "asc" },
        include: { topics: { orderBy: [{ order: "asc" }, { code: "asc" }] }, _count: { select: { questions: true } } },
      },
    },
  });
  if (!book) notFound();

  const where: Prisma.BankQuestionWhereInput = { bookId: book.id };
  if (searchParams.unit) where.unitId = searchParams.unit;
  if (searchParams.type && ["MCQ", "SHORT", "LONG"].includes(searchParams.type)) where.type = searchParams.type as "MCQ" | "SHORT" | "LONG";
  if (searchParams.status && ["DRAFT", "REVIEWED"].includes(searchParams.status)) where.status = searchParams.status as "DRAFT" | "REVIEWED";
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);

  const [total, questions, statusCounts] = await Promise.all([
    db.bankQuestion.count({ where }),
    db.bankQuestion.findMany({
      where,
      orderBy: [{ unit: { number: "asc" } }, { type: "asc" }, { createdAt: "asc" }],
      skip: (page - 1) * PAGE,
      take: PAGE,
      include: { unit: { select: { number: true } }, topic: { select: { code: true } } },
    }),
    db.bankQuestion.groupBy({ by: ["status"], where: { bookId: book.id }, _count: { _all: true } }),
  ]);
  const count = (s: string) => statusCounts.find((c) => c.status === s)?._count._all ?? 0;

  const rows: AdminQuestion[] = questions.map((q) => ({
    id: q.id,
    unit: q.unit.number,
    topic: q.topic?.code ?? null,
    type: q.type,
    source: q.source,
    status: q.status,
    textEn: q.textEn,
    textUr: q.textUr,
    options: (q.options as { en: string; ur: string }[] | null) ?? null,
    answer: q.answer,
    marks: q.marks,
    pastPaperRef: q.pastPaperRef,
  }));

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { unit: searchParams.unit, type: searchParams.type, status: searchParams.status, page: undefined as string | undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/superadmin/bank/${book.id}${s ? `?${s}` : ""}`;
  };
  const chip = (active: boolean) =>
    "rounded-full border px-3 py-1 text-[13px] font-semibold " + (active ? "border-primary bg-primary-tint text-primary" : "border-line-strong bg-surface text-ink-2 hover:text-ink");
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        back={{ href: "/superadmin/bank", label: "All textbooks" }}
        title={`Class ${book.className} ${book.subject}`}
        description={`${book.authority.code}, ${book.edition}, taught from ${book.sessionFrom}. ${count("REVIEWED")} reviewed, ${count("DRAFT")} waiting for review.`}
      />
      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-8 sm:py-8">
        <ConsoleSection title="Units and topics" description="Units come from the book's table of contents. Topics are optional but let teachers pick exactly what was taught.">
          <UnitEditor
            bookId={book.id}
            units={book.units.map((u) => ({ id: u.id, number: u.number, title: u.title, titleUr: u.titleUr, questions: u._count.questions, topics: u.topics.map((t) => ({ id: t.id, code: t.code, title: t.title })) }))}
          />
        </ConsoleSection>

        <ConsoleSection title="Import questions" description="Fill the template in Excel, save it as “CSV UTF-8”, and upload it here. Everything imports as draft until you review it.">
          <ImportPanel bookId={book.id} />
        </ConsoleSection>

        <ConsoleSection title={`Questions (${total})`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href={qs({ unit: undefined })} className={chip(!searchParams.unit)}>All units</Link>
            {book.units.map((u) => (
              <Link key={u.id} href={qs({ unit: u.id })} className={chip(searchParams.unit === u.id)}>Unit {u.number}</Link>
            ))}
          </div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {[undefined, "MCQ", "SHORT", "LONG"].map((t) => (
              <Link key={t ?? "all"} href={qs({ type: t })} className={chip(searchParams.type === t)}>{t ?? "All types"}</Link>
            ))}
            <span className="mx-1 h-5 w-px bg-line" />
            {[undefined, "DRAFT", "REVIEWED"].map((s) => (
              <Link key={s ?? "all"} href={qs({ status: s })} className={chip(searchParams.status === s)}>{s === "DRAFT" ? "Needs review" : s === "REVIEWED" ? "Reviewed" : "Any status"}</Link>
            ))}
          </div>
          <QuestionTable rows={rows} />
          {pages > 1 && (
            <div className="mt-4 flex items-center justify-between text-[14px] text-ink-2">
              <span>Page {page} of {pages}</span>
              <div className="flex gap-2">
                {page > 1 && <Link className={chip(false)} href={qs({ page: String(page - 1) })}>Previous</Link>}
                {page < pages && <Link className={chip(false)} href={qs({ page: String(page + 1) })}>Next</Link>}
              </div>
            </div>
          )}
        </ConsoleSection>
      </div>
    </div>
  );
}
