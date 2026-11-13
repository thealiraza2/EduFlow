"use client";

import { useState } from "react";
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
import { assignBatchTeacherAction } from "@/lib/actions/classes";
import { UserCheck } from "lucide-react";

interface TeacherOption {
  id: string;
  user: {
    name: string;
  };
  subjects: string[];
}

export function AssignTeacherModal({
  batchId,
  batchName,
  currentTeacherId,
  teachers,
}: {
  batchId: string;
  batchName: string;
  currentTeacherId: string | null;
  teachers: TeacherOption[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(currentTeacherId || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await assignBatchTeacherAction({
      batchId,
      teacherId: selectedId ? selectedId : null,
    });
    setLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to assign teacher");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="h-8 px-2 text-xs">
          <UserCheck className="h-3.5 w-3.5 mr-1" />
          {currentTeacherId ? "Reassign Teacher" : "Assign Teacher"}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Teacher to {batchName}</DialogTitle>
          <DialogDescription>
            Select a faculty member responsible for this batch&apos;s lectures and attendance.
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
              Select Teacher
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Unassigned (No Teacher) --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name} ({t.subjects.join(", ")})
                </option>
              ))}
            </select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save Assignment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
