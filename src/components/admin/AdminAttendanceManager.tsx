"use client";

import { useState, useEffect, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMonthlyAttendanceStatsAction,
  getBatchRosterWithAttendanceAction,
  saveBatchAttendanceAction,
} from "@/lib/actions/attendance";
import {
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Users,
  Phone,
  Search,
  RefreshCw,
  Send,
  Clock,
  UserX,
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

interface Props {
  batches: BatchItem[];
  initialMonthlyData?: {
    students: any[];
    atRiskStudents: any[];
    totalStudents: number;
    atRiskCount: number;
  };
}

export function AdminAttendanceManager({ batches, initialMonthlyData }: Props) {
  const [activeTab, setActiveTab] = useState<"monthly" | "daily">("monthly");

  // Filter States
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const todayStr = now.toISOString().split("T")[0];

  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Monthly stats state
  const [monthlyData, setMonthlyData] = useState<{
    students: any[];
    atRiskStudents: any[];
    totalStudents: number;
    atRiskCount: number;
  }>(
    initialMonthlyData || {
      students: [],
      atRiskStudents: [],
      totalStudents: 0,
      atRiskCount: 0,
    }
  );
  const [loadingMonthly, setLoadingMonthly] = useState(false);

  // Daily sheet state
  const [dailyBatchId, setDailyBatchId] = useState<string>(
    batches.length > 0 ? batches[0].id : ""
  );
  const [dailyDate, setDailyDate] = useState<string>(todayStr);
  const [dailyRoster, setDailyRoster] = useState<any[]>([]);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [isSavingDaily, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Load monthly stats
  useEffect(() => {
    // If initial data matches current default filters and hasn't changed, skip refetch
    if (
      initialMonthlyData &&
      selectedMonth === currentMonthStr &&
      selectedBatchId === "ALL" &&
      monthlyData === initialMonthlyData
    ) {
      return;
    }

    let isMounted = true;
    setLoadingMonthly(true);

    getMonthlyAttendanceStatsAction({
      batchId: selectedBatchId === "ALL" ? undefined : selectedBatchId,
      monthStr: selectedMonth,
    })
      .then((data) => {
        if (!isMounted) return;
        setMonthlyData({
          students: data.students,
          atRiskStudents: data.atRiskStudents,
          totalStudents: data.totalStudents,
          atRiskCount: data.atRiskCount,
        });
      })
      .catch((err) => {
        console.error("Failed to load monthly attendance", err);
      })
      .finally(() => {
        if (isMounted) setLoadingMonthly(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMonth, selectedBatchId]);

  // Load daily roster
  useEffect(() => {
    if (activeTab !== "daily" || !dailyBatchId || !dailyDate) return;

    let isMounted = true;
    setLoadingDaily(true);
    setFeedback(null);

    getBatchRosterWithAttendanceAction(dailyBatchId, dailyDate)
      .then((res) => {
        if (!isMounted) return;
        setDailyRoster(
          res.roster.map((s) => ({
            ...s,
            status: s.currentStatus || null,
          }))
        );
      })
      .catch((err) => {
        if (!isMounted) return;
        setFeedback({ type: "error", text: err.message || "Failed to load daily roster" });
      })
      .finally(() => {
        if (isMounted) setLoadingDaily(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, dailyBatchId, dailyDate]);

  const handleDailyStatusChange = (
    enrollmentId: string,
    status: "PRESENT" | "ABSENT" | "LEAVE" | "LATE"
  ) => {
    setDailyRoster((prev) =>
      prev.map((r) => (r.enrollmentId === enrollmentId ? { ...r, status } : r))
    );
  };

  const handleMarkAllDaily = (status: "PRESENT" | "ABSENT") => {
    setDailyRoster((prev) => prev.map((r) => ({ ...r, status })));
  };

  const handleDailySave = () => {
    if (!dailyBatchId || !dailyDate || dailyRoster.length === 0) return;

    const unmarked = dailyRoster.filter((r) => !r.status);
    if (unmarked.length > 0) {
      setFeedback({
        type: "error",
        text: `Please select an attendance status for all students before saving (${unmarked.length} unmarked).`,
      });
      return;
    }

    setFeedback(null);
    startTransition(async () => {
      try {
        const res = await saveBatchAttendanceAction({
          batchId: dailyBatchId,
          date: dailyDate,
          records: dailyRoster.map((r) => ({
            enrollmentId: r.enrollmentId,
            status: r.status,
            remarks: r.remarks || undefined,
          })),
        });

        setFeedback({
          type: "success",
          text: `Admin update saved! ${res.totalSaved} students recorded (${res.absentCount} absent, ${res.notificationsSent} SMS queued).`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to save attendance.",
        });
      }
    });
  };

  // Filter monthly list by search
  const filteredStudents = monthlyData.students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.batchName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* View Switcher Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("monthly")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "monthly"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Monthly Analysis & At-Risk</span>
          {monthlyData.atRiskCount > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs py-0 px-1.5">
              {monthlyData.atRiskCount} At Risk
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("daily")}
          className={`py-3 px-6 text-sm font-semibold border-b-2 transition-colors flex items-center space-x-2 ${
            activeTab === "daily"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span>Daily Register (Admin Editor)</span>
        </button>
      </div>

      {activeTab === "monthly" ? (
        <div className="space-y-6">
          {/* Filters Bar */}
          <Card className="shadow-sm">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                    Select Month
                  </label>
                  <Input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-10 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                    Filter by Batch
                  </label>
                  <select
                    className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                  >
                    <option value="ALL">All Batches (Whole Academy)</option>
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.class.name}-{b.class.section} {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                    Search Student
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search by student name or admission number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-10 text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* At-Risk Students Alert Banner (< 75%) */}
          {monthlyData.atRiskCount > 0 && (
            <Card className="border-rose-200 bg-rose-50/60 shadow-sm overflow-hidden">
              <CardHeader className="py-4 border-b border-rose-200 bg-rose-100/60 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                  <CardTitle className="text-base font-bold text-rose-900">
                    At-Risk Students Notice ({monthlyData.atRiskCount} Below 75% Attendance)
                  </CardTitle>
                </div>
                <Badge variant="destructive" className="font-mono text-xs">
                  Action Required
                </Badge>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs text-rose-700 mb-4">
                  The following students have fallen below the 75% attendance benchmark for{" "}
                  <strong>{selectedMonth}</strong>. Contact guardians to address chronic absenteeism.
                </p>

                <div className="divide-y divide-rose-200/60 bg-white rounded-lg border border-rose-200 overflow-hidden">
                  {monthlyData.atRiskStudents.map((st) => (
                    <div
                      key={st.enrollmentId}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-900 text-sm">{st.name}</span>
                          <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                            {st.admissionNo}
                          </span>
                          <Badge variant="outline" className="text-xs font-normal">
                            {st.batchName}
                          </Badge>
                        </div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                          <span>Guardian: <strong>{st.guardianName}</strong></span>
                          <a
                            href={`tel:${st.guardianPhone}`}
                            className="text-rose-700 hover:underline font-mono flex items-center font-medium"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            {st.guardianPhone}
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right text-xs">
                          <div className="text-slate-500">
                            {st.presentCount} / {st.totalSessions} sessions attended
                          </div>
                          <div className="text-rose-600 font-medium">
                            {st.absentCount} absences
                          </div>
                        </div>
                        <Badge
                          variant="destructive"
                          className="text-sm font-bold px-2.5 py-1 font-mono"
                        >
                          {st.percentage}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Full Monthly Roster Table */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Monthly Student Attendance Records ({selectedMonth})
                </CardTitle>
                <CardDescription className="text-xs">
                  Comprehensive attendance percentage and session breakdown.
                </CardDescription>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {filteredStudents.length} Students Listed
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {loadingMonthly ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading monthly attendance statistics...
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No attendance records found for this selection.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-100/75 text-slate-600 font-semibold">
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-4">Batch</th>
                        <th className="py-3 px-3 text-center">Sessions</th>
                        <th className="py-3 px-3 text-center text-emerald-700">Present</th>
                        <th className="py-3 px-3 text-center text-rose-700">Absent</th>
                        <th className="py-3 px-3 text-center text-amber-700">Leave</th>
                        <th className="py-3 px-3 text-center text-sky-700">Late</th>
                        <th className="py-3 px-4 text-center">Monthly %</th>
                        <th className="py-3 px-4 text-center">Status Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.map((st) => (
                        <tr
                          key={st.enrollmentId}
                          className={`hover:bg-slate-50 transition-colors ${
                            st.isAtRisk ? "bg-rose-50/20" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{st.name}</div>
                            <div className="text-[11px] font-mono text-slate-500">
                              {st.admissionNo} • {st.guardianPhone}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-600">{st.batchName}</td>
                          <td className="py-3 px-3 text-center font-mono font-medium">
                            {st.totalSessions}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-emerald-700 font-semibold">
                            {st.presentCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-rose-700 font-semibold">
                            {st.absentCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-amber-700">
                            {st.leaveCount}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-sky-700">
                            {st.lateCount}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {st.totalSessions === 0 ? (
                              <span className="text-slate-400 text-xs italic font-normal">
                                No sessions recorded
                              </span>
                            ) : (
                              <span
                                className={`font-mono font-bold text-sm ${
                                  st.isAtRisk ? "text-rose-600" : "text-slate-800"
                                }`}
                              >
                                {st.percentage}%
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {st.isAtRisk ? (
                              <Badge
                                variant="destructive"
                                className="text-[10px] uppercase font-bold py-0.5 px-2"
                              >
                                At Risk
                              </Badge>
                            ) : st.totalSessions === 0 ? (
                              <Badge variant="outline" className="text-[10px] text-slate-400">
                                No Sessions
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
                              >
                                Normal
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        /* Tab 2: Daily Register (Admin Override & Editor) */
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                    Select Batch
                  </label>
                  <select
                    className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
                    value={dailyBatchId}
                    onChange={(e) => setDailyBatchId(e.target.value)}
                    disabled={loadingDaily || isSavingDaily}
                  >
                    {batches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.class.name}-{b.class.section} {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                    Date (No Admin Restriction)
                  </label>
                  <div className="flex space-x-2">
                    <Input
                      type="date"
                      value={dailyDate}
                      onChange={(e) => setDailyDate(e.target.value)}
                      disabled={loadingDaily || isSavingDaily}
                      className="w-full"
                    />
                    {dailyDate !== todayStr && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDailyDate(todayStr)}
                        className="text-xs shrink-0"
                      >
                        Today
                      </Button>
                    )}
                  </div>
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border">
                  <strong>Admin Authority:</strong> You can view and modify historical attendance
                  records for any past date without time limits.
                </div>
              </div>
            </CardContent>
          </Card>

          {feedback && (
            <div
              className={`p-4 rounded-lg flex items-start space-x-3 text-sm ${
                feedback.type === "success"
                  ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                  : "bg-red-50 border border-red-200 text-red-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          {/* Daily Table */}
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  Daily Attendance Sheet ({dailyDate})
                </CardTitle>
                <CardDescription className="text-xs">
                  Modifications will update existing database records.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAllDaily("PRESENT")}
                  disabled={isSavingDaily || loadingDaily || dailyRoster.length === 0}
                  className="text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  Mark All Present
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleMarkAllDaily("ABSENT")}
                  disabled={isSavingDaily || loadingDaily || dailyRoster.length === 0}
                  className="text-xs text-rose-700 hover:bg-rose-50"
                >
                  Mark All Absent
                </Button>
                <Button
                  type="button"
                  onClick={handleDailySave}
                  disabled={isSavingDaily || loadingDaily || dailyRoster.length === 0}
                  className="bg-slate-900 text-white"
                >
                  {isSavingDaily ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      <span>Save Daily Attendance</span>
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {loadingDaily ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-slate-400" />
                  Loading daily roster...
                </div>
              ) : dailyRoster.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  No active students enrolled in this batch.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {dailyRoster.map((st, idx) => (
                    <div
                      key={st.enrollmentId}
                      className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-mono text-slate-400 w-6">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-900 text-sm">
                            {st.name}{" "}
                            <span className="font-mono text-xs text-slate-500 font-normal">
                              ({st.admissionNo})
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Guardian: {st.guardianName} • {st.guardianPhone}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {!st.status && (
                          <Badge variant="outline" className="text-[10px] bg-slate-100 text-slate-500 border-slate-300 mr-1">
                            Unmarked
                          </Badge>
                        )}
                        {(["PRESENT", "ABSENT", "LEAVE", "LATE"] as const).map((stat) => (
                          <button
                            key={stat}
                            type="button"
                            onClick={() => handleDailyStatusChange(st.enrollmentId, stat)}
                            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                              st.status === stat
                                ? stat === "PRESENT"
                                  ? "bg-emerald-600 text-white"
                                  : stat === "ABSENT"
                                  ? "bg-rose-600 text-white"
                                  : stat === "LEAVE"
                                  ? "bg-amber-500 text-white"
                                  : "bg-sky-600 text-white"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                            }`}
                          >
                            {stat}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
