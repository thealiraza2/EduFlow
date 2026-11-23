import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { FeeInvoiceManager } from "@/components/admin/FeeInvoiceManager";
import { AlertTriangle } from "@/components/icons";
import { ButtonLink, PageHeader } from "@/components/dashboard/kit";

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
      <PageHeader
        eyebrow="Finance"
        title="Fees"
        description="Generate monthly invoices, download challan PDFs and record payments."
        actions={
          <ButtonLink href="/admin/fees/defaulters" variant="secondary" icon={AlertTriangle}>
            View defaulters
          </ButtonLink>
        }
      />

      <FeeInvoiceManager
        initialInvoices={formattedInvoices}
        currentMonth={currentMonth}
        adminName={admin.name || "Administrator"}
      />
    </div>
  );
}
