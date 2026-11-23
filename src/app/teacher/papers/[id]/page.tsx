import { notFound } from "next/navigation";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { PaperEditor, type EditorQuestion } from "@/components/papers/PaperEditor";
import { DEFAULT_SETTINGS, type PaperSection, type PaperSettings } from "@/lib/bank/paper";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paper | EduFlow" };

export default async function PaperPage({ params, searchParams }: { params: { id: string }; searchParams: { short?: string } }) {
  await requireRole([Role.TEACHER, Role.ADMIN]);
  const { academyId } = await requireTenant();
  const [paper, academy] = await Promise.all([
    db.savedPaper.findFirst({ where: { id: params.id, academyId } }),
    db.academy.findUnique({ where: { id: academyId }, select: { name: true } }),
  ]);
  if (!paper) notFound();

  const sections = paper.sections as unknown as PaperSection[];
  const ids = sections.flatMap((s) => s.questionIds);
  const questions = await db.bankQuestion.findMany({
    where: { id: { in: ids } },
    select: { id: true, type: true, textEn: true, textUr: true, options: true, answer: true },
  });
  const settings = { ...DEFAULT_SETTINGS, schoolName: academy?.name ?? "", ...(paper.settings as Partial<PaperSettings>) };

  return (
    <PaperEditor
      paper={{
        id: paper.id,
        title: paper.title,
        className: paper.className,
        subject: paper.subject,
        timeMinutes: paper.timeMinutes,
        language: paper.language as "en" | "ur" | "dual",
        sections,
        settings,
      }}
      questions={questions.map((q): EditorQuestion => ({ ...q, options: (q.options as { en: string; ur: string }[] | null) ?? null }))}
      shortfall={searchParams.short ?? null}
    />
  );
}
