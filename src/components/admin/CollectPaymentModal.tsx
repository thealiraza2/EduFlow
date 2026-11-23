"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { recordPaymentAction } from "@/lib/actions/fees";
import { formatPKR, rupeesToPaisa } from "@/lib/money";
import { CreditCard, DollarSign, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";

interface InvoiceProps {
  id: string;
  studentName: string;
  admissionNo: string;
  batchName: string;
  month: string;
  totalMinor: number;
  paidMinor: number;
  remainingMinor: number;
}

interface Props {
  invoice: InvoiceProps | null;
  adminName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function CollectPaymentModal({
  invoice,
  adminName,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [amountRupees, setAmountRupees] = useState<string>("");
  const [method, setMethod] = useState<"CASH" | "JAZZCASH" | "EASYPAISA" | "BANK">("CASH");
  const [receivedBy, setReceivedBy] = useState<string>(adminName);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!invoice) return null;

  const remainingRupees = invoice.remainingMinor / 100;

  const handlePayFull = () => {
    setAmountRupees(remainingRupees.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const val = parseFloat(amountRupees);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid payment amount greater than 0 PKR.");
      return;
    }

    if (val > remainingRupees) {
      setError(`Payment cannot exceed the remaining balance of ${formatPKR(invoice.remainingMinor)}.`);
      return;
    }

    const amountMinor = rupeesToPaisa(amountRupees);

    startTransition(async () => {
      try {
        await recordPaymentAction({
          invoiceId: invoice.id,
          amountMinor,
          method,
          receivedBy,
        });

        setAmountRupees("");
        if (onSuccess) onSuccess();
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to record payment.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <DollarSign className="h-5 w-5 mr-1.5 text-emerald-600" />
            Collect Fee Payment
          </DialogTitle>
          <DialogDescription className="text-xs">
            Fee payments are append-only. Invoice status is automatically derived.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Invoice Summary Box */}
          <div className="bg-slate-50 border rounded-lg p-3.5 space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-900">
                {invoice.studentName} ({invoice.admissionNo})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Batch / Month:</span>
              <span className="text-slate-700">
                {invoice.batchName} • {invoice.month}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Total Invoice:</span>
              <span className="font-mono text-slate-700">{formatPKR(invoice.totalMinor)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Paid so far:</span>
              <span className="font-mono text-emerald-600 font-medium">
                {formatPKR(invoice.paidMinor)}
              </span>
            </div>
            <div className="flex justify-between pt-1 border-t text-sm font-semibold">
              <span className="text-slate-900">Remaining Due:</span>
              <span className="font-mono text-rose-600">
                {formatPKR(invoice.remainingMinor)}
              </span>
            </div>
          </div>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount input */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold uppercase text-slate-600">
                Payment Amount (PKR)
              </label>
              <button
                type="button"
                onClick={handlePayFull}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                Pay Full Balance ({formatPKR(invoice.remainingMinor)})
              </button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-mono text-xs">PKR</span>
              <Input
                type="number"
                step="1"
                min="1"
                max={remainingRupees}
                placeholder="e.g. 3000"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                className="pl-12 font-mono text-base font-semibold"
                required
              />
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-600">
              Payment Method
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(["CASH", "JAZZCASH", "EASYPAISA", "BANK"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={`py-2 px-2 text-xs font-semibold rounded-md border text-center transition-all ${
                    method === m
                      ? "bg-slate-900 text-white border-slate-900 shadow-1"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Received By */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-600">
              Received By (Staff / Cashier)
            </label>
            <Input
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              className="text-sm bg-slate-50"
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
            >
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Recording...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Record Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
