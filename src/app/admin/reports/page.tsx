import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { ReportsManager } from "@/components/admin/ReportsManager";
import { FileSpreadsheet } from "lucide-react";

export default async function AdminReportsPage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const batches = await db.batch.findMany({
    where: { academyId: tenant.academyId },
    include: {
      class: {
        select: { name: true },
      },
    },
    orderBy: [{ class: { name: "asc" } }, { name: "asc" }],
  });

  const serializedBatches = batches.map((b) => ({
    id: b.id,
    name: b.name,
    className: b.class.name,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-slate-900 flex items-center">
          <FileSpreadsheet className="h-8 w-8 mr-3 text-slate-900" />
          Analytics & CSV Export Reports
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Generate, preview, and download official academy data reports for accounting, faculty workload, attendance, and student performance.
        </p>
      </div>

      <ReportsManager
        batches={serializedBatches}
        initialMonth={currentMonth}
      />
    </div>
  );
}
