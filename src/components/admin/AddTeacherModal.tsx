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
import { createTeacherAction } from "@/lib/actions/teachers";
import { UserPlus } from "lucide-react";

export function AddTeacherModal() {
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
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      subjects: formData.get("subjects") as string,
      salaryRupees: parseInt(formData.get("salaryRupees") as string, 10) || 0,
      joiningDate: (formData.get("joiningDate") as string) || undefined,
    };

    const res = await createTeacherAction(data);
    setLoading(false);

    if (res.success) {
      setOpen(false);
    } else {
      setError(res.error || "Failed to create teacher account");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800">
          <UserPlus className="h-4 w-4 mr-2" />
          Add New Teacher
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Register New Faculty Member</DialogTitle>
          <DialogDescription>
            Creates an active TEACHER user account and records salary and teaching subjects in a single transaction.
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
              Full Name *
            </label>
            <Input name="name" required placeholder="e.g. Sir Asadullah" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Login Email *
              </label>
              <Input name="email" type="email" required placeholder="asad@academyhub.test" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Password *
              </label>
              <Input name="password" type="password" required placeholder="Min 6 characters" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Contact Phone *
              </label>
              <Input name="phone" required placeholder="03001234567" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase">
                Joining Date
              </label>
              <Input name="joiningDate" type="date" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Subjects Taught (comma separated) *
            </label>
            <Input name="subjects" required placeholder="e.g. Mathematics, Physics, Chemistry" />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase">
              Monthly Salary (PKR) *
            </label>
            <Input
              name="salaryRupees"
              type="number"
              min="0"
              step="1000"
              required
              placeholder="e.g. 45000"
            />
            <p className="text-xs text-slate-400">
              Stored as integer minor units (paisa) adhering strictly to the money invariant.
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
              {loading ? "Registering..." : "Create Teacher Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
