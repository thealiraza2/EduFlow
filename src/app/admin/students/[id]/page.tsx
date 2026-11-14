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
import { ArrowLeft, UserCheck, ShieldAlert, CreditCard } from "lucide-react";
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
        },
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

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-slate-900">{student.name}</h1>
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
                <div className="text-lg font-bold text-slate-900 mt-1">{formatPKR(totalInvoiced)}</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-xs text-emerald-700 font-medium">Total Paid</div>
                <div className="text-lg font-bold text-emerald-800 mt-1">{formatPKR(totalPaid)}</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="text-xs text-red-700 font-medium">Outstanding</div>
                <div className="text-lg font-bold text-red-800 mt-1">{formatPKR(totalBalance)}</div>
              </div>
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
    </div>
  );
}
