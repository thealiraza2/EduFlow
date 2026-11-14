import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { BoardsManager } from "@/components/admin/BoardsManager";
import Link from "next/link";
import { ArrowLeft, School } from "lucide-react";
import { Button } from "@/components/ui/button";

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
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Link href="/admin">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
                <School className="h-6 w-6 mr-2 text-indigo-600" />
                Boards & Pairing Schemes
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage provincial education boards, curriculum chapters, and verified paper schemes.
              </p>
            </div>
          </div>
        </div>

        {/* Manager Component */}
        <BoardsManager boards={boards as any} />
      </div>
    </div>
  );
}
