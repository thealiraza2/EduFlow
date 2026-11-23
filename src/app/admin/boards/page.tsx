import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { BoardsManager } from "@/components/admin/BoardsManager";
import { PageHeader } from "@/components/dashboard/kit";

export default async function AdminBoardsPage() {
  await requireAdmin();

  const boards = await db.board.findMany({
    include: {
      subjects: {
        include: {
          chapters: {
            orderBy: { number: "asc" },
          },
          schemes: true,
        },
        orderBy: [{ className: "asc" }, { name: "asc" }],
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Curriculum"
        title="Boards & paper schemes"
        description="Manage education boards, curriculum chapters and verified paper schemes."
      />
      <BoardsManager boards={boards as any} />
    </div>
  );
}
