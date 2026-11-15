import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { DefaultersManager, DefaulterItem } from "@/components/admin/DefaultersManager";
import { calculateRemainingBalance } from "@/lib/fees";
import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/fees">
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to Fees
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
              <AlertTriangle className="h-6 w-6 mr-2 text-rose-600" />
              Fee Defaulters & Overdue Invoices
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review accounts with unpaid or partial balances past their due dates.
            </p>
          </div>
        </div>
      </div>

      <DefaultersManager
        initialDefaulters={defaulters}
        totalInvoicesCount={totalInvoicesCount}
        adminName={admin.name || "Administrator"}
      />
    </div>
  );
}
