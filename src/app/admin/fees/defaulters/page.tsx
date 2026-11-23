import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DefaultersManager, DefaulterItem } from "@/components/admin/DefaultersManager";
import { calculateRemainingBalance } from "@/lib/fees";
import { ArrowLeft } from "@/components/icons";
import { ButtonLink, PageHeader } from "@/components/dashboard/kit";

export default async function DefaultersPage() {
  const admin = await requireAdmin();
  const tenant = await requireTenant();
  const now = new Date();

  // Find all unpaid or partially paid invoices
  const unpaidInvoices = await db.feeInvoice.findMany({
    where: {
      academyId: tenant.academyId,
      status: { in: ["UNPAID", "PARTIAL"] },
    },
    include: {
      student: true,
      batch: {
        include: {
          class: true,
          feePlan: true,
        },
      },
      payments: true,
    },
    orderBy: [
      { month: "asc" },
      { student: { admissionNo: "asc" } },
    ],
  });

  // Filter to invoices where the due date has actually elapsed
  const defaulters: DefaulterItem[] = [];

  for (const inv of unpaidInvoices) {
    const dueDay = inv.batch.feePlan?.dueDayOfMonth ?? 10;
    const [yearStr, monthStr] = inv.month.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed

    const dueDate = new Date(year, month, dueDay, 23, 59, 59, 999);

    if (now.getTime() > dueDate.getTime()) {
      const diffMs = now.getTime() - dueDate.getTime();
      const daysOverdue = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      const paidMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
      const remainingMinor = calculateRemainingBalance(inv.totalMinor, paidMinor);

      if (remainingMinor > 0) {
        defaulters.push({
          id: inv.id,
          month: inv.month,
          amountMinor: inv.amountMinor,
          fineMinor: inv.fineMinor,
          totalMinor: inv.totalMinor,
          paidMinor,
          remainingMinor,
          status: inv.status as "UNPAID" | "PARTIAL",
          dueDay,
          dueDateStr: `${dueDay}-${monthStr}-${yearStr}`,
          daysOverdue,
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
        });
      }
    }
  }

  const totalInvoicesCount = await db.feeInvoice.count({
    where: { academyId: tenant.academyId },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Finance"
        title="Fee defaulters"
        description="Families with unpaid or partial balances past their due date."
        actions={
          <ButtonLink href="/admin/fees" variant="secondary" icon={ArrowLeft}>
            Back to fees
          </ButtonLink>
        }
      />

      <DefaultersManager
        initialDefaulters={defaulters}
        totalInvoicesCount={totalInvoicesCount}
        adminName={admin.name || "Administrator"}
      />
    </div>
  );
}
