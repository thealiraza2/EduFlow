"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { generateBatchQRAction } from "@/lib/actions/qr";
import { QrCode, RefreshCw, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  timing: string;
  class: {
    name: string;
    section: string;
  };
}

interface Props {
  batches: BatchItem[];
}

export function TeacherQRModal({ batches }: Props) {
  const [open, setOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>(batches[0]?.id || "");
  const [isPending, startTransition] = useTransition();

  const [qrResult, setQrResult] = useState<{
    qrDataUrl: string;
    expiresAt: string;
    date: string;
    batchName: string;
    batchTiming: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Live countdown timer
  useEffect(() => {
    if (!qrResult) return;

    const expiryTime = new Date(qrResult.expiresAt).getTime();

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [qrResult]);

  const handleGenerate = (batchIdToUse?: string) => {
    const id = batchIdToUse || selectedBatchId;
    if (!id) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await generateBatchQRAction(id);
        setQrResult({
          qrDataUrl: res.qrDataUrl,
          expiresAt: res.expiresAt,
          date: res.date,
          batchName: res.batchName,
          batchTiming: res.batchTiming,
        });
      } catch (err: any) {
        setError(err.message || "Failed to generate QR code.");
      }
    });
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          if (!qrResult && batches.length > 0) {
            handleGenerate(batches[0].id);
          }
        }}
        size="sm"
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm flex items-center"
      >
        <QrCode className="h-4 w-4 mr-1.5" />
        Generate Live QR
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-xl">
          <DialogHeader className="text-center pb-2">
            <div className="mx-auto w-10 h-10 bg-indigo-50 border border-indigo-200 rounded-full flex items-center justify-center text-indigo-600 mb-2">
              <QrCode className="h-5 w-5" />
            </div>
            <DialogTitle className="text-xl font-bold text-slate-900">
              Live Batch Attendance QR
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Signed, time-limited QR code valid for exactly 10 minutes.
            </DialogDescription>
          </DialogHeader>

          {/* Batch Selector */}
          <div className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(e) => {
                  setSelectedBatchId(e.target.value);
                  handleGenerate(e.target.value);
                }}
                className="w-full text-xs h-9 px-3 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.class.name} {b.class.section} — {b.name} ({b.timing})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* QR Code Display Card */}
            {isPending ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-2">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <p className="text-xs text-slate-500">Generating signed QR code...</p>
              </div>
            ) : qrResult ? (
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-center space-y-3">
                {/* QR Image */}
                <div className="bg-white p-3 rounded-lg shadow-sm inline-block border mx-auto">
                  <img
                    src={qrResult.qrDataUrl}
                    alt="Attendance QR Code"
                    className="w-56 h-56 mx-auto object-contain"
                  />
                </div>

                {/* Batch & Timing info */}
                <div>
                  <h4 className="font-bold text-sm text-slate-900">{qrResult.batchName}</h4>
                  <p className="text-xs text-slate-500">{qrResult.batchTiming} • {qrResult.date}</p>
                </div>

                {/* Live Expiration Countdown */}
                <div className="flex items-center justify-center space-x-2">
                  <Badge
                    variant="outline"
                    className={`font-mono text-xs px-3 py-1 font-bold ${
                      secondsRemaining > 60
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : secondsRemaining > 0
                        ? "bg-amber-50 text-amber-800 border-amber-300"
                        : "bg-rose-50 text-rose-800 border-rose-300"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {secondsRemaining > 0
                      ? `Expires in: ${formatTimer(secondsRemaining)}`
                      : "QR Code Expired"}
                  </Badge>
                </div>

                {secondsRemaining === 0 && (
                  <p className="text-xs text-rose-600 font-medium">
                    This QR code has expired. Click below to generate a new 10-minute code.
                  </p>
                )}

                {/* Refresh Button */}
                <div className="pt-1">
                  <Button
                    onClick={() => handleGenerate()}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Regenerate QR Code
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="text-[11px] text-slate-400 text-center leading-relaxed">
              Students open their phone camera, scan this code, and confirm attendance. Server prevents duplicate scans and enforces batch enrollment.
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
