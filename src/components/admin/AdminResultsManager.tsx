"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  publishTestAction,
  correctStudentMarkAction,
} from "@/lib/actions/tests";
import {
  calculateBatchAnalytics,
  calculatePositions,
  calculateGrade,
  calculatePercentage,
} from "@/lib/results";
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Download,
  Edit3,
  RefreshCw,
  Search,
  Users,
  BarChart3,
  TrendingDown,
  FileSpreadsheet,
} from "@/components/icons";

interface TestItem {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  date: string;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: string | null;
  batch: {
    id: string;
    name: string;
    class: {
      name: string;
      section: string;
    };
  };
  results: Array<{
    id: string;
    studentId: string;
    obtainedMarks: number;
    remarks: string | null;
    correctionLog: string | null;
    student: {
      id: string;
      name: string;
      admissionNo: string;
      guardianPhone: string;
    };
  }>;
}

interface Props {
  initialTests: TestItem[];
  adminName: string;
}

export function AdminResultsManager({ initialTests, adminName }: Props) {
  const [selectedTestId, setSelectedTestId] = useState<string>(
    initialTests[0]?.id || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  // Correction Modal State
  const [correctionTarget, setCorrectionTarget] = useState<{
    testId: string;
    studentId: string;
    studentName: string;
    currentMarks: number;
    totalMarks: number;
  } | null>(null);
  const [newMarks, setNewMarks] = useState<string>("");
  const [correctionReason, setCorrectionReason] = useState<string>("");
  const [isCorrecting, startCorrectionTransition] = useTransition();

  const selectedTest = initialTests.find((t) => t.id === selectedTestId);

  // Filter tests
  const filteredTests = initialTests.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.batch.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handlePublish = async (testId: string, title: string) => {
    setPublishingId(testId);
    setFeedback(null);
    try {
      await publishTestAction(testId);
      setFeedback({
        type: "success",
        text: `Test "${title}" published successfully! Marks are now locked for faculty and visible to parents.`,
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Failed to publish test.",
      });
    } finally {
      setPublishingId(null);
    }
  };

  const handleOpenCorrection = (r: any) => {
    if (!selectedTest) return;
    setCorrectionTarget({
      testId: selectedTest.id,
      studentId: r.student.id,
      studentName: r.student.name,
      currentMarks: r.obtainedMarks,
      totalMarks: selectedTest.totalMarks,
    });
    setNewMarks(r.obtainedMarks.toString());
    setCorrectionReason("");
  };

  const handleSaveCorrection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionTarget) return;

    const val = parseFloat(newMarks);
    if (isNaN(val) || val < 0 || val > correctionTarget.totalMarks) {
      setFeedback({
        type: "error",
        text: `Marks must be between 0 and ${correctionTarget.totalMarks}.`,
      });
      return;
    }

    if (!correctionReason || correctionReason.trim().length < 3) {
      setFeedback({
        type: "error",
        text: "Please provide a valid administrative reason for this grade correction.",
      });
      return;
    }

    startCorrectionTransition(async () => {
      try {
        await correctStudentMarkAction({
          testId: correctionTarget.testId,
          studentId: correctionTarget.studentId,
          newObtainedMarks: val,
          reason: correctionReason,
        });

        setFeedback({
          type: "success",
          text: `Marks for ${correctionTarget.studentName} updated to ${val} with audit trail logged.`,
        });
        setCorrectionTarget(null);
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to update marks.",
        });
      }
    });
  };

  // Compute analytics for selected test
  const analytics = selectedTest
    ? calculateBatchAnalytics({
        totalMarks: selectedTest.totalMarks,
        results: selectedTest.results.map((r) => ({
          id: r.id,
          obtainedMarks: r.obtainedMarks,
          student: r.student,
        })),
      })
    : null;

  // Compute ranked positions with ties
  const rankedStudents = selectedTest
    ? calculatePositions(
        selectedTest.results.map((r) => ({
          ...r,
          id: r.id,
          obtainedMarks: r.obtainedMarks,
        })),
        selectedTest.totalMarks
      )
    : [];

  // Subject-wise weakest topic / subject across all tests
  const subjectStats: Record<string, { totalPct: number; count: number }> = {};
  initialTests.forEach((t) => {
    if (t.results.length > 0) {
      const avg =
        t.results.reduce((s, r) => s + (r.obtainedMarks / t.totalMarks) * 100, 0) /
        t.results.length;
      if (!subjectStats[t.subject]) subjectStats[t.subject] = { totalPct: 0, count: 0 };
      subjectStats[t.subject].totalPct += avg;
      subjectStats[t.subject].count += 1;
    }
  });

  let weakestSubject: { subject: string; avgPct: number } | null = null;
  for (const [subj, data] of Object.entries(subjectStats)) {
    const avg = Math.round((data.totalPct / data.count) * 10) / 10;
    if (!weakestSubject || avg < weakestSubject.avgPct) {
      weakestSubject = { subject: subj, avgPct: avg };
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Weakest Topic Alert & Overview */}
      {weakestSubject && (
        <Card className="border-amber-200 bg-amber-50/60 shadow-1">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingDown className="h-5 w-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs font-semibold uppercase text-amber-800">
                  Curriculum Analytics: Subject Needing Attention
                </span>
                <p className="text-xs text-amber-900 mt-0.5">
                  <strong>{weakestSubject.subject}</strong> currently has the lowest overall academy average at{" "}
                  <span className="font-mono font-semibold text-amber-800">{weakestSubject.avgPct}%</span>.
                  Consider scheduling remedial tutorial lectures.
                </p>
              </div>
            </div>
            <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-100 text-xs">
              Focus Subject
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Control bar: Test selector & Status filter */}
      <Card className="shadow-1">
        <CardContent className="p-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Select Assessment Test
              </label>
              <select
                value={selectedTestId}
                onChange={(e) => setSelectedTestId(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                {initialTests.map((t) => (
                  <option key={t.id} value={t.id}>
                    [{t.status}] {t.batch.class.name} {t.batch.name} — {t.title} ({t.subject})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
                Status Filter
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 px-3 py-2 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="ALL">All Tests</option>
                <option value="DRAFT">Drafts (Awaiting Publication)</option>
                <option value="PUBLISHED">Published Results</option>
              </select>
            </div>

            {selectedTest && selectedTest.status === "DRAFT" && (
              <div>
                <Button
                  type="button"
                  onClick={() => handlePublish(selectedTest.id, selectedTest.title)}
                  disabled={publishingId === selectedTest.id || selectedTest.results.length === 0}
                  className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-500 text-white font-semibold text-xs flex items-center justify-center space-x-1.5"
                >
                  {publishingId === selectedTest.id ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                      Publishing...
                    </>
                  ) : selectedTest.results.length === 0 ? (
                    <>
                      <AlertTriangle className="h-4 w-4 mr-1.5 text-amber-500" />
                      Cannot Publish (0 Student Marks Entered)
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-1.5" />
                      Publish Test Results ({selectedTest.results.length} Students)
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Alert */}
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

      {selectedTest ? (
        <div className="space-y-6">
          {/* Batch Analytics Cards */}
          {analytics && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="shadow-1">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Class Average</span>
                  <div className="text-2xl font-semibold font-mono text-slate-900 mt-1">
                    {analytics.classAveragePercentage}%
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    {analytics.classAverageMarks} / {selectedTest.totalMarks} avg marks
                  </span>
                </CardContent>
              </Card>

              <Card className="shadow-1">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-emerald-600 uppercase">Highest Score</span>
                  <div className="text-2xl font-semibold font-mono text-emerald-600 mt-1">
                    {analytics.highestMarks} / {selectedTest.totalMarks}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Top position score
                  </span>
                </CardContent>
              </Card>

              <Card className="shadow-1">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-rose-600 uppercase">Lowest Score</span>
                  <div className="text-2xl font-semibold font-mono text-rose-600 mt-1">
                    {analytics.lowestMarks} / {selectedTest.totalMarks}
                  </div>
                  <span className="text-xs text-slate-400 mt-0.5 block">
                    Needs remediation
                  </span>
                </CardContent>
              </Card>

              <Card className="shadow-1 bg-slate-900 text-white">
                <CardContent className="p-5">
                  <span className="text-xs font-semibold text-slate-300 uppercase">Batch Toppers</span>
                  <div className="text-sm font-semibold mt-1">
                    {analytics.toppers.length > 0 ? (
                      analytics.toppers.map((tp, i) => (
                        <div key={i} className="flex justify-between items-center text-xs mt-1">
                          <span className="truncate max-w-[130px]">{tp.name}</span>
                          <span className="font-mono text-amber-300 font-semibold">
                            {tp.obtainedMarks} ({tp.positionFormatted})
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400 text-xs">No marks recorded</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Student Results Roster & Admin Correction Table */}
          <Card className="shadow-1 overflow-hidden">
            <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-slate-900">
                  {selectedTest.title} — Student Results
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedTest.status === "PUBLISHED"
                    ? "Published results are locked. Admin corrections require an audit reason."
                    : "Draft test awaiting administrator publication."}
                </CardDescription>
              </div>
              <Badge
                variant={selectedTest.status === "PUBLISHED" ? "default" : "secondary"}
                className={selectedTest.status === "PUBLISHED" ? "bg-emerald-600 text-white" : ""}
              >
                {selectedTest.status}
              </Badge>
            </CardHeader>

            <CardContent className="p-0">
              {rankedStudents.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  No student marks entered yet for this test.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b bg-slate-100/75 text-slate-600 font-semibold">
                        <th className="py-3 px-4 text-center w-16">Rank</th>
                        <th className="py-3 px-4">Student</th>
                        <th className="py-3 px-3 text-right">Marks</th>
                        <th className="py-3 px-3 text-center">Percentage</th>
                        <th className="py-3 px-3 text-center">Grade</th>
                        <th className="py-3 px-4">Remarks / Audit Trail</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rankedStudents.map((r) => {
                        const original = r.item as any;
                        return (
                          <tr key={r.item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3 px-4 text-center font-mono font-semibold text-slate-800">
                              {r.positionFormatted}
                            </td>

                            <td className="py-3 px-4">
                              <div className="font-semibold text-slate-900">{original.student.name}</div>
                              <div className="text-xs font-mono text-slate-500">
                                {original.student.admissionNo} • {original.student.guardianPhone}
                              </div>
                            </td>

                            <td className="py-3 px-3 text-right font-mono font-semibold text-sm">
                              {r.item.obtainedMarks} <span className="text-slate-400 font-normal text-xs">/ {selectedTest.totalMarks}</span>
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-semibold">
                              {r.percentage}%
                            </td>

                            <td className="py-3 px-3 text-center">
                              <Badge
                                variant="outline"
                                className={`text-xs font-mono font-semibold py-0.5 px-2 ${
                                  r.grade === "A+" || r.grade === "A"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                    : r.grade === "F"
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                }`}
                              >
                                {r.grade}
                              </Badge>
                            </td>

                            <td className="py-3 px-4 text-slate-600 max-w-xs">
                              <div>{original.remarks || "—"}</div>
                              {original.correctionLog && (
                                <div className="text-xs text-amber-800 bg-amber-50 p-1 rounded mt-1 font-mono">
                                  {original.correctionLog}
                                </div>
                              )}
                            </td>

                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-1.5">
                                {/* Download Result Card PDF */}
                                <a
                                  href={`/api/tests/${selectedTest.id}/results/${original.student.id}/card`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-slate-200 hover:bg-slate-100 text-slate-700"
                                  title="Download Official Result Card PDF"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1" />
                                  PDF
                                </a>

                                {/* Admin Correct Marks */}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenCorrection(original)}
                                  className="h-7 text-xs px-2 text-slate-700"
                                  title="Administrative Marks Correction"
                                >
                                  <Edit3 className="h-3 w-3 mr-1" />
                                  Correct
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 bg-white border rounded-xl">
          <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-slate-300" />
          No tests available to review.
        </div>
      )}

      {/* Admin Correction Modal */}
      {correctionTarget && (
        <Dialog open={!!correctionTarget} onOpenChange={(open) => !open && setCorrectionTarget(null)}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg flex items-center">
                <Edit3 className="h-5 w-5 mr-1.5 text-amber-600" />
                Administrative Marks Correction
              </DialogTitle>
              <DialogDescription className="text-xs">
                Modifying marks after publishing requires a documented reason for the audit trail.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveCorrection} className="space-y-4">
              <div className="bg-slate-50 border p-3 rounded-lg text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student:</span>
                  <span className="font-semibold text-slate-900">{correctionTarget.studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Marks:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {correctionTarget.currentMarks} / {correctionTarget.totalMarks}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-600">
                  New Obtained Marks (0 - {correctionTarget.totalMarks})
                </label>
                <Input
                  type="number"
                  min="0"
                  max={correctionTarget.totalMarks}
                  step="0.5"
                  value={newMarks}
                  onChange={(e) => setNewMarks(e.target.value)}
                  className="font-mono font-semibold text-base"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase text-slate-600">
                  Correction Reason (Audit Log)
                </label>
                <Input
                  placeholder="e.g. Recounting total on Section B Question 4"
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  className="text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCorrectionTarget(null)}
                  disabled={isCorrecting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isCorrecting}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  {isCorrecting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    "Save & Log Correction"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
