"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  saveBatchAttendanceAction,
  getBatchRosterWithAttendanceAction,
} from "@/lib/actions/attendance";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
  Send,
  Lock,
  RefreshCw,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  timing: string;
  class: {
    name: string;
    section: string;
  };
}

interface StudentRow {
  enrollmentId: string;
  studentId: string;
  admissionNo: string;
  name: string;
  guardianName: string;
  guardianPhone: string;
  status: ("PRESENT" | "ABSENT" | "LEAVE" | "LATE") | null;
  remarks: string;
}

interface Props {
  batches: BatchItem[];
  userRole: "TEACHER" | "ADMIN";
}

export function TeacherAttendanceSheet({ batches, userRole }: Props) {
  const [selectedBatchId, setSelectedBatchId] = useState<string>(
    batches.length > 0 ? batches[0].id : ""
  );
  // Default to today in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);

  const [roster, setRoster] = useState<StudentRow[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, startTransition] = useTransition();

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load roster whenever batch or date changes
  useEffect(() => {
    if (!selectedBatchId || !selectedDate) return;

    let isMounted = true;
    setLoading(true);
    setMessage(null);

    getBatchRosterWithAttendanceAction(selectedBatchId, selectedDate)
      .then((res) => {
        if (!isMounted) return;
        setIsLocked(res.isLockedForTeacher);
        const mapped: StudentRow[] = res.roster.map((s) => ({
          enrollmentId: s.enrollmentId,
          studentId: s.studentId,
          admissionNo: s.admissionNo,
          name: s.name,
          guardianName: s.guardianName,
          guardianPhone: s.guardianPhone,
          // Default to existing recorded status, or null (unmarked) if no record exists
          status: (s.currentStatus as "PRESENT" | "ABSENT" | "LEAVE" | "LATE" | null) || null,
          remarks: s.remarks || "",
        }));
        setRoster(mapped);
      })
      .catch((err) => {
        if (!isMounted) return;
        setMessage({ type: "error", text: err.message || "Failed to load roster" });
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedBatchId, selectedDate]);

  const handleStatusChange = (
    enrollmentId: string,
    status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE"
  ) => {
    if (isLocked) return;
    setRoster((prev) =>
      prev.map((row) => (row.enrollmentId === enrollmentId ? { ...row, status } : row))
    );
  };

  const handleRemarksChange = (enrollmentId: string, remarks: string) => {
    if (isLocked) return;
    setRoster((prev) =>
      prev.map((row) => (row.enrollmentId === enrollmentId ? { ...row, remarks } : row))
    );
  };

  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    if (isLocked) return;
    setRoster((prev) => prev.map((row) => ({ ...row, status })));
  };

  const handleSave = () => {
    if (!selectedBatchId || !selectedDate || roster.length === 0) return;

    const unmarked = roster.filter((r) => !r.status);
    if (unmarked.length > 0) {
      setMessage({
        type: "error",
        text: `Please select an attendance status for all students before saving (${unmarked.length} unmarked).`,
      });
      return;
    }

    setMessage(null);
    startTransition(async () => {
      try {
        const payload = {
          batchId: selectedBatchId,
          date: selectedDate,
          records: roster.map((r) => ({
            enrollmentId: r.enrollmentId,
            status: r.status!,
            remarks: r.remarks || undefined,
          })),
        };

        const res = await saveBatchAttendanceAction(payload);
        setMessage({
          type: "success",
          text: `Attendance saved successfully for ${res.totalSaved} students! (${res.absentCount} absent, ${res.notificationsSent} absence SMS logged/queued).`,
        });
      } catch (err: any) {
        setMessage({
          type: "error",
          text: err.message || "Failed to save attendance.",
        });
      }
    });
  };

  const currentBatch = batches.find((b) => b.id === selectedBatchId);
  const presentCount = roster.filter((r) => r.status === "PRESENT").length;
  const absentCount = roster.filter((r) => r.status === "ABSENT").length;
  const leaveCount = roster.filter((r) => r.status === "LEAVE").length;
  const lateCount = roster.filter((r) => r.status === "LATE").length;
  const unmarkedCount = roster.filter((r) => !r.status).length;

  return (
    <div className="space-y-6">
      {/* Control bar: Batch and Date pickers */}
      <Card className="shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Select Batch
              </label>
              <select
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                disabled={loading || isSaving}
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.class.name}-{b.class.section} {b.name} ({b.timing})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Attendance Date
              </label>
              <div className="flex space-x-2">
                <Input
                  type="date"
                  value={selectedDate}
                  max={todayStr}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={loading || isSaving}
                  className="w-full"
                />
                {selectedDate !== todayStr && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedDate(todayStr)}
                    className="text-xs shrink-0"
                  >
                    Today
                  </Button>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pb-0.5">
              {currentBatch && (
                <div className="text-xs text-slate-600 bg-slate-100 p-2.5 rounded-lg border w-full">
                  <div className="font-semibold text-slate-900">
                    {currentBatch.class.name} ({currentBatch.name})
                  </div>
                  <div className="text-slate-500 flex items-center mt-0.5">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentBatch.timing}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 7-day Lock Warning for Teachers */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold">Attendance is locked for this date.</strong>
            <p className="mt-0.5">
              This attendance date is older than 7 days. Under academy policy, historical corrections
              older than 7 days must be authorized and updated by an administrator.
            </p>
          </div>
        </div>
      )}

      {/* Notifications / Alerts */}
      {message && (
        <div
          className={`p-4 rounded-lg flex items-start space-x-3 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Quick stats and Batch Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            {presentCount} Present
          </Badge>
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            {absentCount} Absent
          </Badge>
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            {leaveCount} Leave
          </Badge>
          <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200">
            {lateCount} Late
          </Badge>
          {unmarkedCount > 0 && (
            <Badge variant="outline" className="bg-slate-100 text-slate-600 border-slate-300">
              {unmarkedCount} Unmarked
            </Badge>
          )}
          <span className="text-xs text-slate-400 font-mono ml-2">Total: {roster.length}</span>
        </div>

        {!isLocked && roster.length > 0 && (
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("PRESENT")}
              disabled={loading || isSaving}
              className="text-xs text-emerald-700 hover:bg-emerald-50"
            >
              Mark All Present
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleMarkAll("ABSENT")}
              disabled={loading || isSaving}
              className="text-xs text-rose-700 hover:bg-rose-50"
            >
              Mark All Absent
            </Button>
          </div>
        )}
      </div>

      {/* Roster Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="py-4 border-b bg-slate-50">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-base font-semibold text-slate-900">
                Student Attendance Roster
              </CardTitle>
              <CardDescription className="text-xs">
                Mark attendance in under 1 minute. Absent students trigger automatic SMS to guardians.
              </CardDescription>
            </div>
            {loading && (
              <RefreshCw className="h-4 w-4 animate-spin text-slate-400" />
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {roster.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              {loading
                ? "Loading student roster..."
                : "No active students enrolled in this batch."}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {roster.map((student, index) => {
                return (
                  <div
                    key={student.enrollmentId}
                    className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                      student.status === "ABSENT"
                        ? "bg-rose-50/40"
                        : student.status === "LEAVE"
                        ? "bg-amber-50/30"
                        : student.status === "LATE"
                        ? "bg-sky-50/30"
                        : "hover:bg-slate-50/60"
                    }`}
                  >
                    {/* Student Info */}
                    <div className="flex items-start space-x-3 min-w-[240px]">
                      <span className="text-xs font-mono text-slate-400 w-6 pt-1">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 text-sm">
                            {student.name}
                          </span>
                          <span className="font-mono text-xs text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {student.admissionNo}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Guardian: {student.guardianName} •{" "}
                          <span className="font-mono">{student.guardianPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Buttons */}
                    <div className="flex items-center space-x-1 sm:space-x-2 shrink-0">
                      {!student.status && (
                        <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-300 mr-1 shrink-0">
                          Unmarked
                        </Badge>
                      )}
                      <button
                        type="button"
                        disabled={isLocked || isSaving}
                        onClick={() => handleStatusChange(student.enrollmentId, "PRESENT")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          student.status === "PRESENT"
                            ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600 ring-offset-1"
                            : "bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                        }`}
                      >
                        Present
                      </button>

                      <button
                        type="button"
                        disabled={isLocked || isSaving}
                        onClick={() => handleStatusChange(student.enrollmentId, "ABSENT")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          student.status === "ABSENT"
                            ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-600 ring-offset-1"
                            : "bg-slate-100 text-slate-700 hover:bg-rose-50 hover:text-rose-700"
                        }`}
                      >
                        Absent
                      </button>

                      <button
                        type="button"
                        disabled={isLocked || isSaving}
                        onClick={() => handleStatusChange(student.enrollmentId, "LEAVE")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          student.status === "LEAVE"
                            ? "bg-amber-500 text-white shadow-sm ring-2 ring-amber-500 ring-offset-1"
                            : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-700"
                        }`}
                      >
                        Leave
                      </button>

                      <button
                        type="button"
                        disabled={isLocked || isSaving}
                        onClick={() => handleStatusChange(student.enrollmentId, "LATE")}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                          student.status === "LATE"
                            ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-600 ring-offset-1"
                            : "bg-slate-100 text-slate-700 hover:bg-sky-50 hover:text-sky-700"
                        }`}
                      >
                        Late
                      </button>
                    </div>

                    {/* Remarks Input */}
                    <div className="w-full md:w-56">
                      <Input
                        placeholder="Optional remarks..."
                        value={student.remarks}
                        disabled={isLocked || isSaving}
                        onChange={(e) =>
                          handleRemarksChange(student.enrollmentId, e.target.value)
                        }
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* Footer with Save Action */}
        {!isLocked && roster.length > 0 && (
          <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="text-xs text-slate-500">
              Marking updates existing records. Absent students will trigger one SMS alert to guardian.
            </div>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || loading}
              className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white flex items-center space-x-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  <span>Saving Attendance...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  <span>Save Attendance ({roster.length} Students)</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
