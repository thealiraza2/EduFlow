"use client";

import React, { useState } from "react";
import { initiatePaymentAction } from "@/lib/actions/payments";
import { formatPKR } from "@/lib/money";
import { CreditCard, Loader2, ChevronDown, Check } from "lucide-react";
import { useRouter } from "next/navigation";

interface PayInvoiceButtonProps {
  invoiceId: string;
  remainingMinor: number;
}

export function PayInvoiceButton({ invoiceId, remainingMinor }: PayInvoiceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingGateway, setLoadingGateway] = useState<"JAZZCASH" | "EASYPAISA" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handlePay(gateway: "JAZZCASH" | "EASYPAISA") {
    try {
      setLoadingGateway(gateway);
      setError(null);

      const res = await initiatePaymentAction({
        invoiceId,
        gateway,
      });

      if (res.success && res.paymentUrl) {
        window.location.href = res.paymentUrl;
      } else {
        setError("Failed to initialize payment gateway");
      }
    } catch (err: any) {
      console.error("Payment initiation failed:", err);
      setError(err.message || "Failed to start payment");
    } finally {
      setLoadingGateway(null);
    }
  }

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center space-x-1">
        <button
          type="button"
          onClick={() => handlePay("JAZZCASH")}
          disabled={loadingGateway !== null}
          className="inline-flex items-center px-2.5 py-1.5 rounded-l-md text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-1 transition-colors disabled:opacity-50"
        >
          {loadingGateway === "JAZZCASH" ? (
            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
          ) : (
            <CreditCard className="h-3.5 w-3.5 mr-1" />
          )}
          <span>Pay Now</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loadingGateway !== null}
          className="inline-flex items-center px-1.5 py-1.5 rounded-r-md text-xs font-semibold bg-rose-700 hover:bg-rose-800 text-white shadow-1 border-l border-rose-800/40"
          title="Choose wallet: JazzCash or Easypaisa"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-20"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-1 w-52 rounded-lg bg-white shadow-3 border border-slate-200 py-1.5 z-30 text-xs animate-in fade-in zoom-in-95">
            <div className="px-3 py-1 text-xs font-semibold text-slate-400 border-b border-slate-100 uppercase tracking-wider">
              Select Mobile Wallet
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                handlePay("JAZZCASH");
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                <span className="font-semibold text-slate-800 group-hover:text-red-700">
                  JazzCash Wallet
                </span>
              </div>
              <span className="text-xs text-slate-400">Sandbox</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                handlePay("EASYPAISA");
              }}
              className="w-full text-left px-3 py-2 hover:bg-emerald-50 flex items-center justify-between group transition-colors"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                <span className="font-semibold text-slate-800 group-hover:text-emerald-700">
                  Easypaisa Wallet
                </span>
              </div>
              <span className="text-xs text-slate-400">Sandbox</span>
            </button>

            <div className="px-3 pt-1 text-xs text-slate-400 border-t border-slate-100 mt-1 italic">
              Amount: {formatPKR(remainingMinor)}
            </div>
          </div>
        </>
      )}

      {error && (
        <span className="block text-xs text-rose-600 mt-1 font-medium">
          {error}
        </span>
      )}
    </div>
  );
}
