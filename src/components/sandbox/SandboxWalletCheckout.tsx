"use client";

import React, { useState } from "react";
import { formatPKR } from "@/lib/money";
import { ShieldCheck, AlertTriangle, ArrowLeft, Lock, CheckCircle2, XCircle } from "@/components/icons";
import Link from "next/link";

interface CheckoutProps {
  gateway: "jazzcash" | "easypaisa";
  invoiceId: string;
  studentName: string;
  admissionNo: string;
  month: string;
  amountMinor: number;
  transactionId: string;
  validPayload: Record<string, string>;
  tamperedPayload: Record<string, string>;
  webhookUrl: string;
}

export function SandboxWalletCheckout({
  gateway,
  invoiceId,
  studentName,
  admissionNo,
  month,
  amountMinor,
  transactionId,
  validPayload,
  tamperedPayload,
  webhookUrl,
}: CheckoutProps) {
  const [phone, setPhone] = useState("03001234567");
  const [mpin, setMpin] = useState("1234");
  const [isProcessing, setIsProcessing] = useState(false);
  const [testMode, setTestMode] = useState<"valid" | "tampered">("valid");

  const isJazzCash = gateway === "jazzcash";
  const brandColor = isJazzCash ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700";
  const brandBorder = isJazzCash ? "border-red-600" : "border-emerald-600";
  const brandText = isJazzCash ? "text-red-700" : "text-emerald-700";
  const brandBgLight = isJazzCash ? "bg-red-50" : "bg-emerald-50";

  const currentPayload = testMode === "valid" ? validPayload : tamperedPayload;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-3 overflow-hidden border border-slate-200">
        {/* Gateway Brand Header */}
        <div className={`p-6 text-white ${isJazzCash ? "bg-gradient-to-r from-red-700 to-rose-600" : "bg-gradient-to-r from-emerald-700 to-teal-600"}`}>
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs uppercase tracking-widest font-semibold opacity-80">
                Official Sandbox Gateway
              </span>
              <h1 className="font-serif text-2xl font-semibold mt-0.5">
                {isJazzCash ? "JazzCash Mobile Wallet" : "Easypaisa Account"}
              </h1>
            </div>
            <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-semibold">
              SANDBOX
            </div>
          </div>
        </div>

        {/* Honesty Note Alert */}
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3 text-xs text-amber-800 flex items-start space-x-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Developer Honesty Notice:</strong> Sandbox environment is 100% functional with real HMAC-SHA256 signature verification. Live merchant activation requires verified business NTN and commercial bank registration.
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Details Card */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-2.5">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">Academy Invoice</span>
              <span className="font-mono font-semibold text-slate-800">{invoiceId.slice(-8).toUpperCase()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block text-xs">Student</span>
                <span className="font-semibold text-slate-800">{studentName}</span>
                <span className="text-slate-500 block text-xs font-mono">{admissionNo}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block text-xs">Billing Month</span>
                <span className="font-semibold text-slate-800">{month}</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <span className="text-xs font-medium text-slate-600">Total Payable:</span>
              <span className="text-2xl font-semibold font-mono text-slate-900">
                {formatPKR(amountMinor)}
              </span>
            </div>
          </div>

          {/* Test Mode Selector (Invariant 11 Demo) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Simulation Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTestMode("valid")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition-all ${
                  testMode === "valid"
                    ? "bg-slate-900 text-white border-slate-900 shadow-1"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                <span>Genuine Signature</span>
              </button>
              <button
                type="button"
                onClick={() => setTestMode("tampered")}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center space-x-1.5 transition-all ${
                  testMode === "tampered"
                    ? "bg-rose-900 text-white border-rose-900 shadow-1"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <XCircle className="h-3.5 w-3.5 text-rose-400" />
                <span>Tampered / Attack (400)</span>
              </button>
            </div>
            {testMode === "tampered" && (
              <p className="text-xs text-rose-600 mt-1">
                ⚠️ Invariant 11 Test: Submits an altered amount or corrupted signature. The server webhook will reject this request.
              </p>
            )}
          </div>

          {/* Wallet Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                {isJazzCash ? "JazzCash Mobile Number" : "Easypaisa Account Number"}
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="03001234567"
                className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                4-Digit MPIN (Sandbox Test: 1234)
              </label>
              <div className="relative">
                <input
                  type="password"
                  maxLength={4}
                  value={mpin}
                  onChange={(e) => setMpin(e.target.value)}
                  placeholder="••••"
                  className="w-full text-sm px-3.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono tracking-widest"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute right-3 top-3" />
              </div>
            </div>
          </div>

          {/* Hidden Form Posting to Webhook */}
          <form
            action={webhookUrl}
            method="POST"
            onSubmit={() => setIsProcessing(true)}
          >
            {Object.entries(currentPayload).map(([key, value]) => (
              <input key={key} type="hidden" name={key} value={value} />
            ))}

            <button
              type="submit"
              disabled={isProcessing}
              className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-sm shadow-2 transition-all flex items-center justify-center space-x-2 ${
                testMode === "valid" ? brandColor : "bg-rose-600 hover:bg-rose-700"
              } disabled:opacity-50`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>
                {isProcessing
                  ? "Securing Transaction..."
                  : testMode === "valid"
                  ? `Authorize & Pay ${formatPKR(amountMinor)}`
                  : `Send Tampered Attack Payload`}
              </span>
            </button>
          </form>

          {/* Return Back Link */}
          <div className="text-center pt-2">
            <Link
              href="/parent"
              className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center space-x-1"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Cancel and return to Parent Portal</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
