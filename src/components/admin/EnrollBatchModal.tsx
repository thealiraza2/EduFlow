"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { enrollStudentAction } from "@/lib/actions/students";
import { formatPKR } from "@/lib/money";
import { PlusCircle } from "lucide-react";

interface BatchOption {
  id: string;
  name: string;
  timing: string;
  feeMinor: number;
  class: {
    name: string;
    section: string;
  };
  teacher: {
    user: {
      name: string;
    };
  } | null;
}

export function EnrollBatchModal({
  studentId,
  availableBatches,
}: {
  studentId: string;
  availableBatches: BatchOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEnroll(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBatchId) return;

    setLoading(true);
    setError(null);

    const res = await enrollStudentAction({ studentId, batchId: selectedBatchId });
    setLoading(false);

    if (res.success) {
      setOpen(false);
      setSelectedBatchId("");
      router.refresh();
    } else {
      setError(res.error || "Failed to enroll student in batch");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Enroll In Batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll Student in Batch</DialogTitle>
          <DialogDescription>
            Select an academic batch to register this student.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleEnroll} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          {availableBatches.length === 0 ? (
            <p className="text-sm text-slate-500 py-4 text-center">
              No classes or batches have been created yet. Please create classes first.
            </p>
          ) : (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Select Batch *
              </label>
              <select
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                required
              >
                <option value="">-- Choose a batch --</option>
                {availableBatches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.class.name}-{b.class.section} {b.name} ({b.timing}) - {formatPKR(b.feeMinor)}/mo
                    {b.teacher ? ` | Teacher: ${b.teacher.user.name}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !selectedBatchId || availableBatches.length === 0}
            >
              {loading ? "Enrolling..." : "Confirm Enrollment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
