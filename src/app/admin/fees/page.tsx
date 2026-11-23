import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { FeeInvoiceManager } from "@/components/admin/FeeInvoiceManager";
import { Banknote, AlertTriangle } from "@/components/icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminFeesPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  const invoices = await db.feeInvoice.findMany({
    where: { academyId: tenant.academyId },
    include: {
      student: true,
      batch: {
        include: {
          class: true,
        },
      },
      payments: {
        orderBy: { paidAt: "desc" },
      },
    },
    orderBy: [
      { month: "desc" },
      { student: { admissionNo: "asc" } },
    ],
  });

  const formattedInvoices = invoices.map((inv) => ({
    id: inv.id,
    month: inv.month,
    amountMinor: inv.amountMinor,
    fineMinor: inv.fineMinor,
    discountMinor: inv.discountMinor,
    totalMinor: inv.totalMinor,
    status: inv.status as "UNPAID" | "PARTIAL" | "PAID",
    paidAt: inv.paidAt ? inv.paidAt.toISOString() : null,
    student: {
      id: inv.student.id,
      name: inv.student.name,
      admissionNo: inv.student.admissionNo,
      guardianName: inv.student.guardianName,
      guardianPhone: inv.student.guardianPhone,
    },
    batch: {
      id: inv.batch.id,
      name: inv.batch.name,
      class: {
        name: inv.batch.class.name,
        section: inv.batch.class.section,
      },
    },
    payments: inv.payments.map((p) => ({
      id: p.id,
      amountMinor: p.amountMinor,
      method: p.method,
      receivedBy: p.receivedBy,
      gatewayTransactionId: p.gatewayTransactionId,
      paidAt: p.paidAt.toISOString(),
    })),
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-900 flex items-center">
            <Banknote className="h-6 w-6 mr-2 text-emerald-600" />
            Fee Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-generate monthly invoices, download Challan PDFs, and collect append-only payments.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link href="/admin/fees/defaulters">
            <Button variant="outline" size="sm" className="text-xs text-rose-700 border-rose-200 hover:bg-rose-50 flex items-center">
              <AlertTriangle className="h-3.5 w-3.5 mr-1 text-rose-600" />
              View Defaulters
            </Button>
          </Link>
        </div>
      </div>

      <FeeInvoiceManager
        initialInvoices={formattedInvoices}
        currentMonth={currentMonth}
        adminName={admin.name || "Administrator"}
      />
    </div>
  );
}
