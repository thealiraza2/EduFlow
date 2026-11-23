"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createBatchAction } from "@/lib/actions/classes";
import { PlusCircle } from "lucide-react";

interface TeacherOption {
  id: string;
  user: {
    name: string;
  };
  subjects: string[];
}

export function AddBatchModal({
  classId,
  className,
  teachers,
}: {
  classId: string;
  className: string;
  teachers: TeacherOption[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      classId,
      name: formData.get("name") as string,
      timing: formData.get("timing") as string,
      teacherId: (formData.get("teacherId") as string) || undefined,
      feeRupees: parseInt(formData.get("feeRupees") as string, 10) || 0,
    };

    const res = await createBatchAction(data);
    setLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to create batch");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <PlusCircle className="h-4 w-4 mr-1.5" />
          Add Batch
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Batch to Class {className}</DialogTitle>
          <DialogDescription>
            Configure timings, lead teacher, and monthly tuition fee.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Batch Name *
            </label>
            <Input name="name" required placeholder="e.g. Evening Batch, Medical Prep" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Class Timings *
            </label>
            <Input name="timing" required placeholder="e.g. 4:00 PM – 6:00 PM" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Assigned Teacher
            </label>
            <select
              name="teacherId"
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- No Teacher Assigned Yet --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name} ({t.subjects.join(", ")})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Monthly Tuition Fee (PKR) *
            </label>
            <Input
              name="feeRupees"
              type="number"
              min="0"
              step="500"
              required
              placeholder="e.g. 3500"
            />
            <p className="text-xs text-slate-400">
              Stored in integer paisa minor units adhering to the money invariant.
            </p>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
