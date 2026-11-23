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
import { createTimetableSlotAction } from "@/lib/actions/timetable";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { Plus } from "@/components/icons";

interface TeacherOption {
  id: string;
  user: {
    name: string;
  };
  subjects: string[];
}

export function AddSlotModal({
  batchId,
  batchName,
  teachers,
  defaultDay,
}: {
  batchId: string;
  batchName: string;
  teachers: TeacherOption[];
  defaultDay?: number;
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
      batchId,
      dayOfWeek: parseInt(formData.get("dayOfWeek") as string, 10),
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      subject: formData.get("subject") as string,
      teacherId: formData.get("teacherId") as string,
      room: (formData.get("room") as string) || undefined,
    };

    const res = await createTimetableSlotAction(data);
    setLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to create slot");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Schedule Slot
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Lecture Slot — {batchName}</DialogTitle>
          <DialogDescription>
            Schedule a weekly lecture. The system enforces strict overlap and teacher double-booking checks.
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
              Day of the Week *
            </label>
            <select
              name="dayOfWeek"
              defaultValue={defaultDay ?? 1}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-1 focus:outline-none focus:ring-1 focus:ring-ring"
              required
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Start Time (HH:mm) *
              </label>
              <Input name="startTime" type="time" required defaultValue="16:00" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                End Time (HH:mm) *
              </label>
              <Input name="endTime" type="time" required defaultValue="17:00" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Subject Name *
            </label>
            <Input name="subject" required placeholder="e.g. Mathematics, Physics, English" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Instructor / Teacher *
            </label>
            <select
              name="teacherId"
              required
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-1 focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">-- Choose Instructor --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.user.name} ({t.subjects.join(", ")})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Classroom / Room (Optional)
            </label>
            <Input name="room" placeholder="e.g. Hall 1, Room 102" />
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
              {loading ? "Scheduling..." : "Save Slot"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
