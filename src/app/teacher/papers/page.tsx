import Link from "next/link";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { ButtonLink, EmptyState, PageHeader, Panel, StatusPill } from "@/components/dashboard/kit";
import { FileText, Plus } from "@/components/icons";

export const dynamic = "force-dynamic";
export const metadata = { title: "Papers | EduFlow" };

export default async function PapersPage() {
  await requireRole([Role.TEACHER, Role.ADMIN]);
  const { academyId } = await requireTenant();
  const papers = await db.savedPaper.findMany({
    where: { academyId },
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, title: true, className: true, subject: true, totalMarks: true, language: true, updatedAt: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Paper generator"
        title="Papers"
        description="Board-style papers built from the EduFlow question bank, ready to print."
        actions={<ButtonLink href="/teacher/papers/new" icon={Plus}>New paper</ButtonLink>}
      />
      {papers.length === 0 ? (
        <EmptyState icon={FileText} title="No papers yet" body="Build your first paper in about a minute." action={<ButtonLink href="/teacher/papers/new" icon={Plus}>New paper</ButtonLink>} />
      ) : (
        <Panel flush>
          <ul className="divide-y divide-line">
            {papers.map((p) => (
              <li key={p.id}>
                <Link href={`/teacher/papers/${p.id}`} className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-canvas sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-ink">{p.title}</p>
                    <p className="text-[13px] text-ink-3">Class {p.className} {p.subject}, {p.totalMarks} marks</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <StatusPill tone="plum">{p.language === "dual" ? "Dual" : p.language === "ur" ? "Urdu" : "English"}</StatusPill>
                    <span className="hidden text-[12.5px] text-ink-3 sm:inline">{p.updatedAt.toLocaleDateString("en-PK", { day: "numeric", month: "short" })}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
