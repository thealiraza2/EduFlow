"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendFeeReminderAction } from "@/lib/actions/fees";
import { formatPKR } from "@/lib/money";
import { CollectPaymentModal } from "./CollectPaymentModal";
import Link from "next/link";
import {
  AlertTriangle,
  Send,
  Phone,
  Search,
  RefreshCw,
  Download,
  CreditCard,
  CheckCircle2,
  Calendar,
  ArrowLeft,
} from "lucide-react";

export interface DefaulterItem {
  id: string;
  month: string;
  amountMinor?: number;
  fineMinor?: number;
  totalMinor: number;
  paidMinor: number;
  remainingMinor: number;
  status: "UNPAID" | "PARTIAL";
  dueDay: number;
  dueDateStr: string;
  daysOverdue: number;
  student: {
    id: string;
    name: string;
    admissionNo: string;
    guardianName: string;
    guardianPhone: string;
  };
  batch: {
    id: string;
    name: string;
    class: {
      name: string;
      section: string;
    };
  };
}

interface Props {
  initialDefaulters: DefaulterItem[];
  totalInvoicesCount?: number;
  adminName: string;
}

export function DefaultersManager({ initialDefaulters, totalInvoicesCount = 0, adminName }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [sentReminders, setSentReminders] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleSendReminder = async (invoiceId: string, studentName: string) => {
    setRemindingId(invoiceId);
    setFeedback(null);
    try {
      const res = await sendFeeReminderAction(invoiceId);
      setSentReminders((prev) => ({
        ...prev,
        [invoiceId]: res.recipientPhone,
      }));
      setFeedback({
        type: "success",
        text: `Fee reminder SMS queued for ${studentName}'s guardian at ${res.recipientPhone}!`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to send fee reminder.",
      });
    } finally {
      setRemindingId(null);
    }
  };

  const filtered = initialDefaulters.filter((d) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.student.name.toLowerCase().includes(q) ||
      d.student.admissionNo.toLowerCase().includes(q) ||
      d.batch.name.toLowerCase().includes(q)
    );
  });

  const totalOutstandingMinor = filtered.reduce((sum, d) => sum + d.remainingMinor, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-rose-200 bg-rose-50/60 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-rose-700 uppercase">Defaulter Invoices</span>
            <div className="text-2xl font-bold font-mono text-rose-900 mt-1">
              {filtered.length} Overdue
            </div>
            <span className="text-[11px] text-rose-600 mt-0.5 block">Unpaid / partial past due date</span>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/60 shadow-sm">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-rose-700 uppercase">Total Overdue Receivables</span>
            <div className="text-2xl font-bold font-mono text-rose-700 mt-1">
              {formatPKR(totalOutstandingMinor)}
            </div>
            <span className="text-[11px] text-rose-600 mt-0.5 block">Pending recovery</span>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-5 flex flex-col justify-center">
            <span className="text-xs font-semibold text-slate-500 uppercase">Action Guideline</span>
            <p className="text-xs text-slate-600 mt-1">
              Send one-tap SMS reminders to guardians or download updated fee challans for cash counter collection.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Feedback */}
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by student name or admission number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </CardContent>
      </Card>

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
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Defaulters Table */}
      <Card className="border-rose-200 shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b border-rose-200 bg-rose-50/50 flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <div>
              <CardTitle className="text-base font-bold text-rose-900">
                Fee Defaulters List
              </CardTitle>
              <CardDescription className="text-xs text-rose-700">
                Invoices with UNPAID or PARTIAL status where the due date has elapsed.
              </CardDescription>
            </div>
          </div>
          <Badge variant="destructive" className="font-mono text-xs">
            {filtered.length} Overdue
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {totalInvoicesCount === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No invoices issued yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Zero fee invoices have been issued for this academy. Generate monthly fee invoices from the Fees dashboard.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700">No fee defaulters found</p>
              <p className="text-xs text-slate-400 mt-1">
                All issued invoices due to date are fully collected or on schedule.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-rose-100/40 text-slate-700 font-semibold">
                    <th className="py-3 px-4">Student & Guardian</th>
                    <th className="py-3 px-4">Batch / Month</th>
                    <th className="py-3 px-3 text-center">Due Date</th>
                    <th className="py-3 px-3 text-center">Overdue</th>
                    <th className="py-3 px-3 text-right">Fee</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Paid</th>
                    <th className="py-3 px-3 text-right text-rose-700 font-bold">Balance Due</th>
                    <th className="py-3 px-4 text-right">One-Tap Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-rose-50/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{item.student.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {item.student.admissionNo}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center mt-0.5">
                          <span>Guardian: {item.student.guardianName} • </span>
                          <a
                            href={`tel:${item.student.guardianPhone}`}
                            className="text-rose-700 hover:underline font-mono font-medium ml-1 flex items-center"
                          >
                            <Phone className="h-2.5 w-2.5 mr-0.5" />
                            {item.student.guardianPhone}
                          </a>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {item.batch.class.name} {item.batch.name}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{item.month}</div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-600">
                        {item.dueDateStr}
                      </td>

                      <td className="py-3 px-3 text-center font-mono">
                        <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold">
                          {item.daysOverdue}d ago
                        </Badge>
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-medium">
                        <div>{formatPKR(item.totalMinor)}</div>
                        {item.fineMinor !== undefined && item.fineMinor > 0 && (
                          <div className="text-[10px] text-amber-700 font-sans mt-0.5">
                            Base: {formatPKR(item.amountMinor ?? item.totalMinor - item.fineMinor)} + Fine: {formatPKR(item.fineMinor)}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                        {formatPKR(item.paidMinor)}
                      </td>

                      <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 text-sm">
                        {formatPKR(item.remainingMinor)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {/* One-tap Fee Reminder */}
                          <Button
                            size="sm"
                            onClick={() => handleSendReminder(item.id, item.student.name)}
                            disabled={remindingId === item.id || !!sentReminders[item.id]}
                            className={`h-7 text-xs px-2.5 flex items-center space-x-1 ${
                              sentReminders[item.id]
                                ? "bg-slate-100 text-slate-500 border"
                                : "bg-rose-600 hover:bg-rose-700 text-white"
                            }`}
                          >
                            {remindingId === item.id ? (
                              <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <Send className="h-3 w-3 mr-1" />
                            )}
                            <span>{sentReminders[item.id] ? "Reminder Sent" : "Fee Reminder"}</span>
                          </Button>

                          {/* Download Challan */}
                          <a
                            href={`/api/invoices/${item.id}/challan`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 rounded text-xs border border-slate-200 hover:bg-slate-100 text-slate-700"
                            title="Download Fee Challan"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>

                          {/* Collect Payment */}
                          <Button
                            size="sm"
                            onClick={() =>
                              setSelectedInvoiceForPayment({
                                id: item.id,
                                studentName: item.student.name,
                                admissionNo: item.student.admissionNo,
                                batchName: `${item.batch.class.name} ${item.batch.name}`,
                                month: item.month,
                                totalMinor: item.totalMinor,
                                paidMinor: item.paidMinor,
                                remainingMinor: item.remainingMinor,
                              })
                            }
                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                          >
                            <CreditCard className="h-3.5 w-3.5 mr-1" />
                            Collect
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Collect Payment Modal */}
      {selectedInvoiceForPayment && (
        <CollectPaymentModal
          invoice={selectedInvoiceForPayment}
          adminName={adminName}
          isOpen={!!selectedInvoiceForPayment}
          onClose={() => setSelectedInvoiceForPayment(null)}
        />
      )}
    </div>
  );
}
