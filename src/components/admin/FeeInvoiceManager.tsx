"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateInvoicesAction } from "@/lib/actions/fees";
import { formatPKR } from "@/lib/money";
import { CollectPaymentModal } from "./CollectPaymentModal";
import Link from "next/link";
import {
  DollarSign,
  Download,
  Search,
  RefreshCw,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  FileText,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";

interface InvoiceItem {
  id: string;
  month: string;
  amountMinor: number;
  fineMinor: number;
  discountMinor: number;
  totalMinor: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  paidAt: string | null;
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
  payments: Array<{
    id: string;
    amountMinor: number;
    method: string;
    receivedBy: string;
    gatewayTransactionId?: string | null;
    paidAt: string;
  }>;
}

interface Props {
  initialInvoices: InvoiceItem[];
  currentMonth: string;
  adminName: string;
}

export function FeeInvoiceManager({
  initialInvoices,
  currentMonth,
  adminName,
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isGenerating, startGenerateTransition] = useTransition();
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<any | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  const handleGenerate = () => {
    setFeedback(null);
    startGenerateTransition(async () => {
      try {
        const res = await generateInvoicesAction(selectedMonth);
        setFeedback({
          type: "success",
          text: `Invoicing complete for ${res.month}! Created ${res.createdCount} new invoices (${res.skippedCount} already existed).`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to generate monthly invoices.",
        });
      }
    });
  };

  // Filter invoices
  const filtered = initialInvoices.filter((inv) => {
    if (inv.month !== selectedMonth) return false;
    if (statusFilter !== "ALL" && inv.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = inv.student.name.toLowerCase().includes(q);
      const matchRoll = inv.student.admissionNo.toLowerCase().includes(q);
      const matchBatch = inv.batch.name.toLowerCase().includes(q);
      if (!matchName && !matchRoll && !matchBatch) return false;
    }
    return true;
  });

  // Calculate metrics for selected month
  const monthInvoices = initialInvoices.filter((inv) => inv.month === selectedMonth);
  const totalBilledMinor = monthInvoices.reduce((sum, inv) => sum + inv.totalMinor, 0);
  const totalCollectedMinor = monthInvoices.reduce(
    (sum, inv) => sum + inv.payments.reduce((pSum, p) => pSum + p.amountMinor, 0),
    0
  );
  const totalPendingMinor = Math.max(0, totalBilledMinor - totalCollectedMinor);
  const collectionRate =
    totalBilledMinor > 0 ? Math.round((totalCollectedMinor / totalBilledMinor) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-1">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-500 uppercase">Total Billed ({selectedMonth})</span>
            <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
              {formatPKR(totalBilledMinor)}
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">{monthInvoices.length} total invoices</span>
          </CardContent>
        </Card>

        <Card className="shadow-1">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-emerald-600 uppercase">Total Collected</span>
            <div className="text-2xl font-semibold font-mono text-emerald-600 mt-1">
              {formatPKR(totalCollectedMinor)}
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">{collectionRate}% collection rate</span>
          </CardContent>
        </Card>

        <Card className="shadow-1">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-rose-600 uppercase">Outstanding Balance</span>
            <div className="text-2xl font-semibold font-mono text-rose-600 mt-1">
              {formatPKR(totalPendingMinor)}
            </div>
            <span className="text-xs text-slate-400 mt-0.5 block">Pending receivables</span>
          </CardContent>
        </Card>

        <Card className="shadow-1 bg-slate-900 text-white flex flex-col justify-between">
          <CardContent className="p-5">
            <span className="text-xs font-semibold text-slate-300 uppercase">Defaulters Alert</span>
            <div className="text-lg font-semibold mt-1 text-white flex items-center">
              Overdue Accounts
              <ArrowUpRight className="h-4 w-4 ml-1 text-rose-400" />
            </div>
            <Link
              href="/admin/fees/defaulters"
              className="text-xs text-rose-300 hover:text-white underline mt-2 block"
            >
              View Defaulters & Send Reminders →
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Control Bar: Month, Generate Invoices, Search, Filters */}
      <Card className="shadow-1">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Billing Month
              </label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Status Filter
              </label>
              <select
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="PARTIAL">Partial</option>
                <option value="PAID">Paid</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Search Invoices
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Student or admission no..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 text-sm"
                />
              </div>
            </div>

            <div>
              <Button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center space-x-1.5"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                    <span>Generating Invoices...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4 mr-1.5" />
                    <span>Generate {selectedMonth} Invoices</span>
                  </>
                )}
              </Button>
            </div>
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
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Invoices List Table */}
      <Card className="shadow-1 overflow-hidden">
        <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Student Invoices ({selectedMonth})
            </CardTitle>
            <CardDescription className="text-xs">
              Fee invoices for active enrollments. Download Challan PDF or record append-only payments.
            </CardDescription>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            {filtered.length} Invoices
          </Badge>
        </CardHeader>

        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium text-slate-600">No invoices found for {selectedMonth}</p>
              <p className="text-xs text-slate-400 mt-1">
                Click <strong>"Generate {selectedMonth} Invoices"</strong> above to auto-generate bills for all active students.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100/75 text-slate-600 font-semibold">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-3 text-right">Fee</th>
                    <th className="py-3 px-3 text-right text-emerald-700">Paid</th>
                    <th className="py-3 px-3 text-right text-rose-700">Remaining</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => {
                    const paidMinor = inv.payments.reduce((s, p) => s + p.amountMinor, 0);
                    const remainingMinor = Math.max(0, inv.totalMinor - paidMinor);

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{inv.student.name}</div>
                          <div className="text-xs font-mono text-slate-500">
                            {inv.student.admissionNo} • {inv.student.guardianPhone}
                          </div>
                          {inv.payments.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {inv.payments.map((p) => (
                                <span
                                  key={p.id}
                                  className={`inline-flex items-center text-xs font-mono px-1.5 py-0.5 rounded font-semibold ${
                                    p.gatewayTransactionId
                                      ? "bg-purple-100 text-purple-800 border border-purple-200"
                                      : "bg-slate-100 text-slate-700 border border-slate-200"
                                  }`}
                                  title={
                                    p.gatewayTransactionId
                                      ? `Gateway Txn: ${p.gatewayTransactionId}`
                                      : `Manual: ${p.receivedBy}`
                                  }
                                >
                                  {p.gatewayTransactionId
                                    ? `${p.method} (Gateway)`
                                    : `${p.method} (Manual)`}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 text-slate-600">
                          {inv.batch.class.name} {inv.batch.name}
                        </td>

                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-semibold text-slate-900">{formatPKR(inv.totalMinor)}</div>
                          {inv.fineMinor > 0 && (
                            <div className="text-xs text-amber-700 font-sans mt-0.5">
                              Base: {formatPKR(inv.amountMinor)} + Fine: {formatPKR(inv.fineMinor)}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-700">
                          {formatPKR(paidMinor)}
                        </td>

                        <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600">
                          {formatPKR(remainingMinor)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <Badge
                            variant={
                              inv.status === "PAID"
                                ? "default"
                                : inv.status === "PARTIAL"
                                ? "secondary"
                                : "destructive"
                            }
                            className={`text-xs uppercase font-semibold py-0.5 px-2 ${
                              inv.status === "PAID"
                                ? "bg-emerald-600 text-white"
                                : inv.status === "PARTIAL"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-rose-100 text-rose-800 border-rose-200"
                            }`}
                          >
                            {inv.status}
                          </Badge>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {/* Download Challan PDF */}
                            <a
                              href={`/api/invoices/${inv.id}/challan`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2.5 py-1.5 rounded text-xs font-medium border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                              title="Download Fee Challan PDF"
                            >
                              <Download className="h-3.5 w-3.5 mr-1 text-slate-500" />
                              Challan
                            </a>

                            {/* Collect Payment Modal trigger */}
                            {remainingMinor > 0 && (
                              <Button
                                size="sm"
                                onClick={() =>
                                  setSelectedInvoiceForPayment({
                                    id: inv.id,
                                    studentName: inv.student.name,
                                    admissionNo: inv.student.admissionNo,
                                    batchName: `${inv.batch.class.name} ${inv.batch.name}`,
                                    month: inv.month,
                                    totalMinor: inv.totalMinor,
                                    paidMinor,
                                    remainingMinor,
                                  })
                                }
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-2.5"
                              >
                                <CreditCard className="h-3.5 w-3.5 mr-1" />
                                Collect
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
