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
import { admitStudentAction } from "@/lib/actions/students";
import { UserPlus } from "lucide-react";

interface BatchOption {
  id: string;
  name: string;
  class: {
    name: string;
    section?: string | null;
  };
}

interface AdmitStudentModalProps {
  batches?: BatchOption[];
}

export function AdmitStudentModal({ batches = [] }: AdmitStudentModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createParent, setCreateParent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);

    const data = {
      name: formData.get("name") as string,
      guardianName: formData.get("guardianName") as string,
      guardianPhone: formData.get("guardianPhone") as string,
      dateOfBirth: (formData.get("dateOfBirth") as string) || undefined,
      address: (formData.get("address") as string) || undefined,
      batchId: (formData.get("batchId") as string) || undefined,
      createParentAccount: createParent,
      parentEmail: (formData.get("parentEmail") as string) || undefined,
      parentPassword: (formData.get("parentPassword") as string) || undefined,
    };

    const res = await admitStudentAction(data);
    setLoading(false);

    if (res.success) {
      setOpen(false);
      setCreateParent(false);
    } else {
      setError(res.error || "Failed to admit student");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-900 hover:bg-slate-800">
          <UserPlus className="h-4 w-4 mr-2" />
          Admit New Student
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Admit New Student</DialogTitle>
          <DialogDescription>
            Generate an official sequential admission number and record guardian details.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Student Full Name *
            </label>
            <Input name="name" required placeholder="e.g. Ali Ahmed Khan" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Guardian Name *
              </label>
              <Input name="guardianName" required placeholder="e.g. Tariq Khan" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Guardian Phone *
              </label>
              <Input name="guardianPhone" required placeholder="03001234567" />
            </div>
          </div>

          {batches.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Assign Class & Batch
              </label>
              <select
                name="batchId"
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="">-- Select Class & Batch (Optional) --</option>
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.class.name} {b.class.section ? `(${b.class.section})` : ""} — {b.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                Enrolling during admission links the student to class curriculum, tests, and monthly fee generation.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Date of Birth
              </label>
              <Input name="dateOfBirth" type="date" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Residential Address
              </label>
              <Input name="address" placeholder="e.g. Street 4, Sector G-9, Islamabad" />
            </div>
          </div>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="createParent"
                checked={createParent}
                onChange={(e) => setCreateParent(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-slate-900 focus:ring-slate-900"
              />
              <label htmlFor="createParent" className="text-sm font-medium text-slate-700 cursor-pointer">
                Create Parent Portal Account for Guardian
              </label>
            </div>

            {createParent && (
              <div className="p-3 bg-slate-50 border rounded-md space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Guardian Portal Email *
                  </label>
                  <Input
                    name="parentEmail"
                    type="email"
                    required={createParent}
                    placeholder="guardian@example.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">
                    Temporary Password *
                  </label>
                  <Input
                    name="parentPassword"
                    type="password"
                    required={createParent}
                    placeholder="Min 6 characters"
                  />
                </div>
              </div>
            )}
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
              {loading ? "Admitting..." : "Admit Student"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
