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
import { createClassAction } from "@/lib/actions/classes";
import { Plus } from "lucide-react";

export function AddClassModal() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      section: formData.get("section") as string,
      capacity: parseInt(formData.get("capacity") as string, 10) || 40,
    };

    const res = await createClassAction(data);
    setLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to create class");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800">
          <Plus className="h-4 w-4 mr-1.5" />
          Add New Class
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Academic Class</DialogTitle>
          <DialogDescription>
            Define an educational level (e.g. 9th, 10th, 1st Year, O-Levels) and section.
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
              Class Name *
            </label>
            <Input name="name" required placeholder="e.g. 9th, 10th, FSc-I, Matric" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Section *
              </label>
              <Input name="section" required placeholder="e.g. A, Morning, Boys" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Max Capacity
              </label>
              <Input name="capacity" type="number" min="1" defaultValue="40" required />
            </div>
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
              {loading ? "Creating..." : "Create Class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
