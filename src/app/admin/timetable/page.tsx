import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import Link from "next/link";
import { AddSlotModal } from "@/components/admin/AddSlotModal";
import { TimetableGrid } from "@/components/admin/TimetableGrid";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, School, Clock } from "@/components/icons";
import { PageHeader } from "@/components/dashboard/kit";

export default async function AdminTimetablePage({
  searchParams,
}: {
  searchParams: { batchId?: string };
}) {
  await requireAdmin();
  const tenant = await requireTenant();

  const [batches, teachers] = await Promise.all([
    db.batch.findMany({
      where: { academyId: tenant.academyId },
      include: {
        class: true,
        teacher: { include: { user: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    db.teacher.findMany({
      where: {
        academyId: tenant.academyId,
        status: "ACTIVE",
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const selectedBatchId = searchParams.batchId || (batches.length > 0 ? batches[0].id : null);
  const selectedBatch = batches.find((b) => b.id === selectedBatchId) || null;

  const slots = selectedBatch
    ? await db.timetableSlot.findMany({
        where: {
          batchId: selectedBatch.id,
          academyId: tenant.academyId,
        },
        include: {
          teacher: {
            include: { user: true },
          },
        },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Timetable"
        description="Plan each batch's weekly lectures. Teacher double-bookings are blocked automatically."
        actions={
          selectedBatch ? (
            <AddSlotModal
              batchId={selectedBatch.id}
              batchName={`${selectedBatch.class.name}-${selectedBatch.class.section} ${selectedBatch.name}`}
              teachers={teachers}
            />
          ) : undefined
        }
      />

      {batches.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <School className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-900">No batches created yet</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Please create an academic class and batch first before setting up timetables.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Batch Selector Bar */}
          <div className="flex items-center space-x-3 overflow-x-auto pb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
              Select Batch:
            </span>
            <div className="flex space-x-2">
              {batches.map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/timetable?batchId=${b.id}`}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${
                    b.id === selectedBatchId
                      ? "bg-slate-900 text-white border-slate-900 shadow-1"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {b.class.name}-{b.class.section} {b.name}
                </Link>
              ))}
            </div>
          </div>

          {selectedBatch && (
            <div className="p-4 bg-white rounded-lg border shadow-1 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Class {selectedBatch.class.name}-{selectedBatch.class.section} ({selectedBatch.name})
                  </h3>
                  <Badge variant="outline">{slots.length} Lectures/Week</Badge>
                </div>
                <div className="flex items-center space-x-4 text-xs text-slate-500 mt-1">
                  <span className="flex items-center">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    Batch Hours: {selectedBatch.timing}
                  </span>
                  <span>
                    Lead Teacher:{" "}
                    <strong>{selectedBatch.teacher?.user.name || "Unassigned"}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timetable Grid */}
          {selectedBatch && (
            <TimetableGrid slots={slots} batchId={selectedBatch.id} />
          )}
        </div>
      )}
    </div>
  );
}
