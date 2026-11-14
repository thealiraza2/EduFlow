import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { AdminAttendanceManager } from "@/components/admin/AdminAttendanceManager";
import { CheckCircle2 } from "lucide-react";

export default async function AdminAttendancePage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const batches = await db.batch.findMany({
    where: { academyId: tenant.academyId },
    include: {
      class: true,
    },
    orderBy: [
      { class: { name: "asc" } },
      { name: "asc" },
    ],
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <CheckCircle2 className="h-6 w-6 mr-2 text-emerald-600" />
            Attendance Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor academy attendance, track students below the 75% benchmark, and manage daily registers.
          </p>
        </div>
      </div>

      <AdminAttendanceManager
        batches={batches.map((b) => ({
          id: b.id,
          name: b.name,
          timing: b.timing,
          class: {
            name: b.class.name,
            section: b.class.section,
          },
        }))}
      />
    </div>
  );
}
