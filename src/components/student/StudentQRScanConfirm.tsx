"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { confirmQRScanAction } from "@/lib/actions/qr";
import { QRScanResult, QRVerificationResult } from "@/lib/qr";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  School,
  Loader2,
  Calendar,
} from "@/components/icons";

interface Props {
  token: string;
  verification: QRVerificationResult;
  batchInfo?: {
    name: string;
    className: string;
    section: string;
    timing: string;
  } | null;
  studentName?: string;
  alreadyMarked?: boolean;
}

export function StudentQRScanConfirm({
  token,
  verification,
  batchInfo,
  studentName,
  alreadyMarked = false,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<QRScanResult | null>(
    alreadyMarked
      ? {
          success: true,
          status: "ALREADY_RECORDED",
          message: "Your attendance for today has already been recorded. Duplicate scan ignored.",
        }
      : null
  );

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        const res = await confirmQRScanAction(token);
        setResult(res);
      } catch (err: any) {
        setResult({
          success: false,
          status: "ERROR",
          message: err.message || "Failed to confirm attendance.",
        });
      }
    });
  };

  // If token is invalid or expired
  if (!verification.valid) {
    const isExpired = verification.error === "EXPIRED";

    return (
      <Card className="max-w-md mx-auto shadow-2 border-rose-200">
        <CardHeader className="bg-rose-50 border-b text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mb-2">
            {isExpired ? <Clock className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
          </div>
          <CardTitle className="text-xl font-semibold text-rose-900">
            {isExpired ? "QR Code Expired" : "Invalid QR Code"}
          </CardTitle>
          <CardDescription className="text-xs text-rose-700">
            {verification.errorMessage ||
              "This attendance QR code cannot be verified by the server."}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 text-center space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Attendance QR codes are cryptographically signed and expire after 10 minutes to maintain security.
            Please ask your instructor to generate a fresh QR code.
          </p>

          <Link href="/student">
            <Button variant="outline" className="w-full text-xs">
              Return to Student Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // If attendance has been confirmed or already recorded
  if (result) {
    const isSuccess = result.status === "MARKED_PRESENT";
    const isAlready = result.status === "ALREADY_RECORDED";

    return (
      <Card
        className={`max-w-md mx-auto shadow-2 ${
          isSuccess
            ? "border-emerald-200"
            : isAlready
            ? "border-blue-200"
            : "border-rose-200"
        }`}
      >
        <CardHeader
          className={`border-b text-center pb-4 ${
            isSuccess
              ? "bg-emerald-50"
              : isAlready
              ? "bg-blue-50"
              : "bg-rose-50"
          }`}
        >
          <div
            className={`mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
              isSuccess
                ? "bg-emerald-100 text-emerald-600"
                : isAlready
                ? "bg-blue-100 text-blue-600"
                : "bg-rose-100 text-rose-600"
            }`}
          >
            {isSuccess || isAlready ? (
              <CheckCircle2 className="h-6 w-6" />
            ) : (
              <AlertTriangle className="h-6 w-6" />
            )}
          </div>

          <CardTitle
            className={`text-xl font-semibold ${
              isSuccess
                ? "text-emerald-900"
                : isAlready
                ? "text-blue-900"
                : "text-rose-900"
            }`}
          >
            {isSuccess
              ? "Attendance Marked!"
              : isAlready
              ? "Already Recorded"
              : "Verification Error"}
          </CardTitle>
          <CardDescription
            className={`text-xs ${
              isSuccess
                ? "text-emerald-700"
                : isAlready
                ? "text-blue-700"
                : "text-rose-700"
            }`}
          >
            {result.message}
          </CardDescription>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {batchInfo && (
            <div className="bg-slate-50 p-3 rounded-lg border text-xs text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Class & Section:</span>
                <span className="font-semibold">
                  {batchInfo.className} ({batchInfo.section})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Batch:</span>
                <span className="font-semibold">{batchInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Timing:</span>
                <span>{batchInfo.timing}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <Badge className="bg-emerald-600 text-white text-xs">
                  PRESENT
                </Badge>
              </div>
            </div>
          )}

          <Link href="/student">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs">
              Go to Student Dashboard <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Valid token ready for student confirmation
  return (
    <Card className="max-w-md mx-auto shadow-2 border-indigo-200">
      <CardHeader className="bg-gradient-to-r from-indigo-50/70 to-blue-50/70 border-b text-center pb-4">
        <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 mb-2">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <CardTitle className="text-xl font-semibold text-slate-900">
          Confirm Batch Attendance
        </CardTitle>
        <CardDescription className="text-xs text-slate-500">
          Scanned from instructor screen via mobile camera
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 space-y-5">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
          {studentName && (
            <div className="flex justify-between pb-2 border-b border-slate-200">
              <span className="text-slate-500">Student:</span>
              <span className="font-semibold text-slate-900">{studentName}</span>
            </div>
          )}

          {batchInfo && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">Class:</span>
                <span className="font-medium text-slate-800">
                  {batchInfo.className} ({batchInfo.section})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Batch:</span>
                <span className="font-medium text-slate-800">{batchInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timing:</span>
                <span className="text-slate-700">{batchInfo.timing}</span>
              </div>
            </>
          )}

          <div className="flex justify-between pt-1">
            <span className="text-slate-500">Date:</span>
            <span className="font-mono text-slate-700">
              {verification.payload?.date}
            </span>
          </div>
        </div>

        <div className="text-xs text-slate-500 text-center">
          Click below to record your attendance as <strong>PRESENT</strong> for today.
          Duplicate scans for the same day are automatically ignored.
        </div>

        <Button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-11 shadow-1"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Recording Attendance...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Confirm My Attendance
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
