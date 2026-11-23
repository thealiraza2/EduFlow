import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPKR } from "@/lib/money";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, UserCheck, ShieldAlert, CreditCard, FileText, Download } from "@/components/icons";
import { EnrollBatchModal } from "@/components/admin/EnrollBatchModal";
import { StudentStatusChanger } from "@/components/admin/StudentStatusChanger";

export default async function StudentProfilePage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const tenant = await requireTenant();

  const student = await db.student.findFirst({
    where: { id: params.id, academyId: tenant.academyId },
    include: {
      guardianUser: true,
      enrollments: {
        include: {
          batch: {
            include: {
              class: true,
              teacher: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
      invoices: {
        include: {
          payments: true,
          batch: {
            include: {
              class: true,
            },
          },
        },
        orderBy: { month: "desc" },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Fetch all batches for enrollment selection
  const allBatches = await db.batch.findMany({
    where: { academyId: tenant.academyId },
    include: {
      class: true,
      teacher: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate fee status summary
  const totalInvoiced = student.invoices.reduce((acc, inv) => acc + inv.totalMinor, 0);
  const totalPaid = student.invoices.reduce((acc, inv) => {
    const paidForInvoice = inv.payments.reduce((pAcc, p) => pAcc + p.amountMinor, 0);
    return acc + paidForInvoice;
  }, 0);
  const totalBalance = Math.max(0, totalInvoiced - totalPaid);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Students
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-1">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="font-serif text-3xl font-semibold text-slate-900">{student.name}</h1>
            <Badge
              variant={
                student.status === "ACTIVE"
                  ? "default"
                  : student.status === "LEFT"
                  ? "secondary"
                  : "destructive"
              }
            >
              {student.status}
            </Badge>
          </div>
          <p className="text-sm font-mono text-slate-500 mt-1">
            Admission No: <strong className="text-slate-900">{student.admissionNo}</strong> | Registered on {student.createdAt.toLocaleDateString("en-PK")}
          </p>
        </div>

        <StudentStatusChanger studentId={student.id} currentStatus={student.status} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guardian & Contact Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Guardian Details</CardTitle>
            <CardDescription>Primary parent / emergency contact</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Guardian Name:</span>
              <span className="font-semibold text-slate-900">{student.guardianName}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="font-mono font-medium text-slate-900">{student.guardianPhone}</span>
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Parent Portal Login:</span>
              {student.guardianUser ? (
                <span className="flex items-center text-emerald-700 font-medium">
                  <UserCheck className="h-4 w-4 mr-1" />
                  Linked ({student.guardianUser.email})
                </span>
              ) : (
                <span className="flex items-center text-amber-600 font-medium">
                  <ShieldAlert className="h-4 w-4 mr-1" />
                  Not configured
                </span>
              )}
            </div>
            <div className="flex justify-between py-1 border-b">
              <span className="text-slate-500">Date of Birth:</span>
              <span className="text-slate-900">
                {student.dateOfBirth ? student.dateOfBirth.toLocaleDateString("en-PK") : "Not specified"}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Address:</span>
              <span className="text-slate-900 text-right max-w-xs">{student.address || "Not specified"}</span>
            </div>
          </CardContent>
        </Card>

        {/* Fee Status Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Fee Status Summary
            </CardTitle>
            <CardDescription>Consolidated ledger summary across all batches</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center pt-2">
              <div className="p-3 bg-slate-50 rounded-lg border">
                <div className="text-xs text-slate-500 font-medium">Total Invoiced</div>
                <div className="text-lg font-semibold text-slate-900 mt-1">{formatPKR(totalInvoiced)}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-xs text-emerald-700 font-medium">Total Paid</div>
                <div className="text-lg font-semibold text-emerald-800 mt-1">{formatPKR(totalPaid)}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="text-xs text-red-700 font-medium">Outstanding</div>
                <div className="text-lg font-semibold text-red-800 mt-1">{formatPKR(totalBalance)}</div>
              </div>
            </div>
            <div className="rounded-lg bg-amber-50/70 border border-amber-200/80 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center">
                Fee Structure Breakdown
              </p>
              <p className="text-amber-800">
                Monthly tuition is <strong>PKR 4,000</strong>. An automated <strong>PKR 200 late fee</strong> is applied to unpaid invoices after the 10th of each billing month (Total: PKR 4,200).
              </p>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Detailed invoices and challans are managed under the Fees module.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Batch Enrollments Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">Enrolled Batches</CardTitle>
            <CardDescription>Academic classes and batches this student is enrolled in</CardDescription>
          </div>
          <EnrollBatchModal
            studentId={student.id}
            availableBatches={allBatches}
          />
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Class & Section</TableHead>
                <TableHead>Batch Name</TableHead>
                <TableHead>Timing</TableHead>
                <TableHead>Assigned Teacher</TableHead>
                <TableHead>Monthly Fee</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.enrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-20 text-center text-slate-500">
                    This student is not enrolled in any batches yet. Click &quot;Enroll In Batch&quot; above.
                  </TableCell>
                </TableRow>
              ) : (
                student.enrollments.map((enr) => (
                  <TableRow key={enr.id}>
                    <TableCell className="font-semibold text-slate-900">
                      {enr.batch.class.name} - {enr.batch.class.section}
                    </TableCell>
                    <TableCell>{enr.batch.name}</TableCell>
                    <TableCell className="text-slate-600 font-mono text-xs">{enr.batch.timing}</TableCell>
                    <TableCell>
                      {enr.batch.teacher ? (
                        enr.batch.teacher.user.name
                      ) : (
                        <span className="text-xs text-slate-400 italic">Unassigned</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {formatPKR(enr.batch.feeMinor)}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {enr.enrolledAt.toLocaleDateString("en-PK")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={enr.status === "ACTIVE" ? "default" : "secondary"}>
                        {enr.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Issued Invoices & Fee Challans Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <FileText className="h-5 w-5 mr-2 text-emerald-600" />
            Issued Invoices & Fee Breakdown
          </CardTitle>
          <CardDescription>
            Detailed billing records, late fine breakdown, and downloadable 3-copy PDF challans
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Billing Month</TableHead>
                <TableHead>Class & Batch</TableHead>
                <TableHead className="text-right">Base Tuition</TableHead>
                <TableHead className="text-right">Late Fine</TableHead>
                <TableHead className="text-right font-semibold">Total Billable</TableHead>
                <TableHead className="text-right text-emerald-700">Paid</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Challan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {student.invoices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-20 text-center text-slate-500">
                    No invoices generated for this student yet. Invoices are generated under the Fees module.
                  </TableCell>
                </TableRow>
              ) : (
                student.invoices.map((inv) => {
                  const paid = inv.payments.reduce((acc, p) => acc + p.amountMinor, 0);
                  return (
                    <TableRow key={inv.id}>
                      <TableCell className="font-semibold text-slate-900 font-mono text-xs">
                        {inv.month}
                      </TableCell>
                      <TableCell>
                        {inv.batch ? `${inv.batch.class.name} ${inv.batch.name}` : "General"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-slate-900">
                        {formatPKR(inv.amountMinor)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {inv.fineMinor > 0 ? (
                          <span className="text-amber-700 font-medium font-mono">
                            +{formatPKR(inv.fineMinor)}
                          </span>
                        ) : (
                          <span className="text-slate-400">PKR 0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-slate-900">
                        {formatPKR(inv.totalMinor)}
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold text-emerald-700">
                        {formatPKR(paid)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={
                            inv.status === "PAID"
                              ? "default"
                              : inv.status === "PARTIAL"
                              ? "secondary"
                              : "destructive"
                          }
                          className="text-xs uppercase font-semibold"
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <a
                          href={`/api/invoices/${inv.id}/challan`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded border border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          <Download className="h-3 w-3 mr-1 text-slate-500" />
                          PDF
                        </a>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
