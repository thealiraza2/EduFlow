"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { markTeacherSalaryAction } from "@/lib/actions/admin";
import { formatPKR } from "@/lib/money";
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Info,
  Calendar,
  DollarSign,
  UserCheck,
} from "lucide-react";

interface TeacherItem {
  id: string;
  salaryMinor: number;
  subjects: string[];
  status: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  batches: Array<{
    id: string;
    name: string;
    class: {
      name: string;
    };
  }>;
  weeklyHours: number;
  salaries: Array<{
    id: string;
    month: string;
    amountMinor: number;
    status: "PAID" | "UNPAID";
    paidAt: string | null;
    notes: string | null;
  }>;
}

interface Props {
  teachers: TeacherItem[];
  initialMonth: string;
}

export function TeacherSalariesManager({ teachers, initialMonth }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleToggleSalary = async (teacherId: string, currentStatus: "PAID" | "UNPAID", teacherName: string) => {
    setProcessingId(teacherId);
    setFeedback(null);
    const newStatus = currentStatus === "PAID" ? "UNPAID" : "PAID";

    try {
      await markTeacherSalaryAction({
        teacherId,
        month: selectedMonth,
        status: newStatus,
        notes: `Marked ${newStatus} on ${new Date().toISOString().split("T")[0]}`,
      });

      setFeedback({
        type: "success",
        text: `Salary for ${teacherName} (${selectedMonth}) marked as ${newStatus}!`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to update salary status.",
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Metrics for selected month
  const totalPayrollMinor = teachers.reduce((sum, t) => sum + t.salaryMinor, 0);
  const paidTeachers = teachers.filter((t) => {
    const s = t.salaries.find((sal) => sal.month === selectedMonth);
    return s?.status === "PAID";
  });
  const totalPaidMinor = paidTeachers.reduce((sum, t) => sum + t.salaryMinor, 0);
  const totalPendingMinor = Math.max(0, totalPayrollMinor - totalPaidMinor);

  return (
    <div className="space-y-6">
      {/* Statutory Disclaimer Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start space-x-3 text-blue-900 shadow-xs">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-semibold block text-sm mb-0.5">
            Operational Accounting Notice
          </strong>
          Marking a salary as <strong>PAID</strong> records the disbursement inside AcademyHub
          for internal record-keeping and audit reporting. Actual bank wire transfers, pay orders, or
          cash disbursements happen outside the software system.
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase text-slate-500">
              Total Monthly Payroll ({selectedMonth})
            </span>
            <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
              {formatPKR(totalPayrollMinor)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {teachers.length} Faculty Members
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase text-emerald-600">
              Disbursed Payroll
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
              {formatPKR(totalPaidMinor)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {paidTeachers.length} of {teachers.length} Teachers Paid
            </span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold uppercase text-amber-600">
              Pending Disbursement
            </span>
            <div className="text-2xl font-bold font-mono text-amber-600 mt-1">
              {formatPKR(totalPendingMinor)}
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {teachers.length - paidTeachers.length} Teachers Pending
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Month Picker */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-slate-500" />
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block">
                Payroll Month
              </label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-9 w-44 text-sm mt-1"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Viewing records for <strong>{selectedMonth}</strong>
          </div>
        </CardContent>
      </Card>

      {/* Feedback Message */}
      {feedback && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 text-sm ${
            feedback.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Faculty Salary Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Faculty Salary Register ({selectedMonth})
            </CardTitle>
            <CardDescription className="text-xs">
              Base salary defined in faculty contract with workload and disbursement status.
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {teachers.length} Teachers
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-100/75 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Faculty Member</th>
                  <th className="py-3 px-4">Subjects & Batches</th>
                  <th className="py-3 px-3 text-center">Workload</th>
                  <th className="py-3 px-4 text-right">Monthly Salary</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {teachers.map((t) => {
                  const salaryRecord = t.salaries.find((s) => s.month === selectedMonth);
                  const isPaid = salaryRecord?.status === "PAID";
                  const paidAtStr = salaryRecord?.paidAt
                    ? salaryRecord.paidAt.split("T")[0]
                    : null;

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900 text-sm">{t.user.name}</div>
                        <div className="text-[11px] font-mono text-slate-500">
                          {t.user.email} {t.user.phone ? `• ${t.user.phone}` : ""}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800">{t.subjects.join(", ")}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {t.batches.length > 0
                            ? t.batches.map((b) => `${b.class.name} ${b.name}`).join("; ")
                            : "No active batches"}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <Badge variant="outline" className="font-mono text-[10px]">
                          <Clock className="h-3 w-3 mr-1 text-slate-400" />
                          {t.weeklyHours}h / week
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-900">
                        {formatPKR(t.salaryMinor)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <Badge
                          variant={isPaid ? "default" : "outline"}
                          className={`text-[10px] font-bold py-0.5 px-2 ${
                            isPaid
                              ? "bg-emerald-600 text-white"
                              : "bg-amber-50 text-amber-700 border-amber-300"
                          }`}
                        >
                          {isPaid ? "PAID" : "UNPAID"}
                        </Badge>
                        {paidAtStr && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {paidAtStr}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() =>
                            handleToggleSalary(
                              t.id,
                              isPaid ? "PAID" : "UNPAID",
                              t.user.name
                            )
                          }
                          disabled={processingId === t.id}
                          className={`h-7 text-xs px-2.5 ${
                            isPaid
                              ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border"
                              : "bg-emerald-600 hover:bg-emerald-700 text-white"
                          }`}
                        >
                          {processingId === t.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                          ) : (
                            <DollarSign className="h-3 w-3 mr-1" />
                          )}
                          <span>{isPaid ? "Undo Paid" : "Mark as Paid"}</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
