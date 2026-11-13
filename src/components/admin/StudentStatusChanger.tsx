"use client";

import { useState } from "react";
import { StudentStatus } from "@prisma/client";
import { updateStudentStatusAction } from "@/lib/actions/students";
import { Button } from "@/components/ui/button";

export function StudentStatusChanger({
  studentId,
  currentStatus,
}: {
  studentId: string;
  currentStatus: StudentStatus;
}) {
  const [status, setStatus] = useState<StudentStatus>(currentStatus);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleStatusChange(newStatus: StudentStatus) {
    if (newStatus === status) return;

    setLoading(true);
    setMessage(null);

    const res = await updateStudentStatusAction({ studentId, status: newStatus });
    setLoading(false);

    if (res.success) {
      setStatus(newStatus);
      setMessage(`Status updated to ${newStatus}`);
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage(res.error || "Failed to update status");
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
      <span className="text-sm font-medium text-slate-700">Change Status:</span>
      <div className="flex space-x-2">
        {(["ACTIVE", "LEFT", "STRUCK_OFF"] as StudentStatus[]).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={status === s ? "default" : "outline"}
            disabled={loading || status === s}
            onClick={() => handleStatusChange(s)}
            className="text-xs"
          >
            {s}
          </Button>
        ))}
      </div>
      {message && (
        <span className="text-xs font-medium text-slate-600 animate-fade-in">
          {message}
        </span>
      )}
    </div>
  );
}
