import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PageHeader, ButtonLink } from "@/components/dashboard/kit";
import { ArrowLeft } from "@/components/icons";
import { PaperWizard, type WizardBook } from "@/components/papers/PaperWizard";

export const dynamic = "force-dynamic";
export const metadata = { title: "New paper | EduFlow" };

export default async function NewPaperPage() {
  await requireRole([Role.TEACHER, Role.ADMIN, Role.SUPER_ADMIN]);
  const [books, counts] = await Promise.all([
    db.book.findMany({
      where: { isCurrent: true },
      orderBy: [{ className: "asc" }, { subject: "asc" }],
      include: { units: { orderBy: { number: "asc" }, include: { topics: { orderBy: [{ order: "asc" }, { code: "asc" }] } } } },
    }),
    db.bankQuestion.groupBy({ by: ["unitId", "type", "source"], where: { status: "REVIEWED" }, _count: { _all: true } }),
  ]);

  const data: WizardBook[] = books.map((b) => ({
    id: b.id,
    className: b.className,
    subject: b.subject,
    subjectUr: b.subjectUr,
    edition: b.edition,
    units: b.units.map((u) => ({
      id: u.id,
      number: u.number,
      title: u.title,
      topics: u.topics.map((t) => ({ id: t.id, code: t.code, title: t.title })),
      counts: counts.filter((c) => c.unitId === u.id).map((c) => ({ type: c.type, source: c.source, n: c._count._all })),
    })),
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Paper generator"
        title="New paper"
        description="Pick the book and chapters, shape the sections, and EduFlow picks reviewed questions from the bank. You can swap any question before printing."
        actions={<ButtonLink href="/teacher/papers" variant="secondary" icon={ArrowLeft}>My papers</ButtonLink>}
      />
      <PaperWizard books={data} />
    </div>
  );
}
