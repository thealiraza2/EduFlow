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
import { createTestAction } from "@/lib/actions/tests";
import { FileSpreadsheet, PlusCircle, RefreshCw, AlertCircle } from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  class: {
    name: string;
    section: string;
  };
}

interface Props {
  batches: BatchItem[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (testId: string) => void;
}

export function CreateTestModal({ batches, isOpen, onClose, onSuccess }: Props) {
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || "");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [totalMarks, setTotalMarks] = useState<string>("100");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tm = parseInt(totalMarks, 10);
    if (isNaN(tm) || tm <= 0) {
      setError("Total marks must be a positive integer.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await createTestAction({
          batchId,
          subject,
          title,
          totalMarks: tm,
          date,
        });

        if (onSuccess) onSuccess(res.testId);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to create test.");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-blue-600" />
            Create Assessment Test
          </DialogTitle>
          <DialogDescription className="text-xs">
            Create an assessment test. Marks remain in DRAFT status until published by admin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-600">Select Batch</label>
            <select
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              required
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.class.name}-{b.class.section} {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-600">Subject</label>
              <Input
                placeholder="e.g. Maths, Physics"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-600">Total Marks</label>
              <Input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 100"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-600">Test Title</label>
            <Input
              placeholder="e.g. Chapter 1 Assessment Quiz"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase text-slate-600">Test Date</label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="bg-slate-900 text-white">
              {isPending ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  Creating...
                </>
              ) : (
                <>
                  <PlusCircle className="h-4 w-4 mr-1.5" />
                  Create Test
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
