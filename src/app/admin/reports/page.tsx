import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { ReportsManager } from "@/components/admin/ReportsManager";
import { PageHeader } from "@/components/dashboard/kit";

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
      <PageHeader
        eyebrow="Insights"
        title="Reports"
        description="Preview and download reports for fees, teacher workload, attendance and student performance."
      />

      <ReportsManager
        batches={serializedBatches}
        initialMonth={currentMonth}
      />
    </div>
  );
}
