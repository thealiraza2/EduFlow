import Link from "next/link";
import { requireSuperAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { ConsolePageHeader, ConsoleSection } from "@/components/superadmin/ConsoleUI";
import { BookCreateForm, MakeCurrentButton } from "@/components/bank/BankAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Question bank | EduFlow Platform" };

export default async function BankPage() {
  await requireSuperAdmin();
  const [authorities, books, counts] = await Promise.all([
    db.textbookAuthority.findMany({ orderBy: { code: "asc" }, select: { id: true, code: true, name: true } }),
    db.book.findMany({
      orderBy: [{ className: "asc" }, { subject: "asc" }, { sessionFrom: "desc" }],
      include: { authority: { select: { code: true } }, _count: { select: { units: true, questions: true } } },
    }),
    db.bankQuestion.groupBy({ by: ["bookId", "status"], _count: { _all: true } }),
  ]);
  const reviewed = new Map(counts.filter((c) => c.status === "REVIEWED").map((c) => [c.bookId, c._count._all]));
  const classes = [...new Set(books.map((b) => b.className))];

  return (
    <div className="min-h-screen bg-canvas">
      <ConsolePageHeader
        title="Question bank"
        description="Textbooks, chapters and questions that every academy's paper generator uses. Teachers only see questions you mark as reviewed."
      />
      <div className="mx-auto grid max-w-[1100px] gap-6 px-4 py-6 sm:px-8 sm:py-8">
        <ConsoleSection title="Add a textbook" description="Add the edition that is taught now. Adding a new edition of the same book makes it the current one; old papers keep working.">
          <BookCreateForm authorities={authorities} />
        </ConsoleSection>

        {books.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line-strong bg-surface p-8 text-center text-[15px] text-ink-2">
            No textbooks yet. Add the first one above, for example PECTA, class 9, Physics, National Curriculum 2023.
          </p>
        ) : (
          classes.map((cls) => (
            <ConsoleSection key={cls} title={`Class ${cls}`}>
              <ul className="divide-y divide-line">
                {books.filter((b) => b.className === cls).map((b) => {
                  const r = reviewed.get(b.id) ?? 0;
                  const pct = b._count.questions ? Math.round((r / b._count.questions) * 100) : 0;
                  return (
                    <li key={b.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <Link href={`/superadmin/bank/${b.id}`} className="min-w-0 group">
                        <p className="text-[16px] font-semibold text-ink group-hover:text-primary">
                          {b.subject}
                          {b.subjectUr && <span className="ml-2 text-ink-3">{b.subjectUr}</span>}
                        </p>
                        <p className="text-[13px] text-ink-3">
                          {b.authority.code}, {b.edition}, taught from {b.sessionFrom}
                          {b.isCurrent ? <span className="ml-2 rounded-full bg-status-success-bg px-2 py-0.5 text-[12px] font-semibold text-status-success">Current</span> : <span className="ml-2 rounded-full bg-surface-sunken px-2 py-0.5 text-[12px] font-semibold text-ink-2">Old edition</span>}
                        </p>
                      </Link>
                      <div className="flex shrink-0 items-center gap-4 text-[13px] text-ink-2">
                        <span>{b._count.units} units</span>
                        <span>{b._count.questions} questions</span>
                        <span className="font-semibold text-ink">{pct}% reviewed</span>
                        {!b.isCurrent && <MakeCurrentButton bookId={b.id} />}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ConsoleSection>
          ))
        )}
      </div>
    </div>
  );
}
