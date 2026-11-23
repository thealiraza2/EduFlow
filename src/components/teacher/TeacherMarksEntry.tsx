"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { submitTestMarksAction } from "@/lib/actions/tests";
import { calculateGrade, calculatePercentage } from "@/lib/results";
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Download,
  Users,
  Award,
} from "@/components/icons";

interface StudentItem {
  id: string;
  name: string;
  admissionNo: string;
}

interface TestData {
  id: string;
  title: string;
  subject: string;
  totalMarks: number;
  date: string;
  status: "DRAFT" | "PUBLISHED";
  batch: {
    name: string;
    class: {
      name: string;
      section: string;
    };
  };
  results: Array<{
    studentId: string;
    obtainedMarks: number;
    remarks: string | null;
  }>;
}

interface Props {
  test: TestData;
  students: StudentItem[];
  userRole: "TEACHER" | "ADMIN";
}

export function TeacherMarksEntry({ test, students, userRole }: Props) {
  // Initialize marks state from existing results or default empty/zero
  const [marksState, setMarksState] = useState<
    Record<string, { obtainedMarks: string; remarks: string }>
  >(() => {
    const map: Record<string, { obtainedMarks: string; remarks: string }> = {};
    const existingMap = new Map(test.results.map((r) => [r.studentId, r]));

    for (const st of students) {
      const ex = existingMap.get(st.id);
      map[st.id] = {
        obtainedMarks: ex !== undefined ? ex.obtainedMarks.toString() : "",
        remarks: ex?.remarks || "",
      };
    }
    return map;
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isSaving, startTransition] = useTransition();

  const isLocked = test.status === "PUBLISHED" && userRole === "TEACHER";

  const handleMarkChange = (studentId: string, value: string) => {
    if (isLocked) return;
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        obtainedMarks: value,
      },
    }));
  };

  const handleRemarksChange = (studentId: string, value: string) => {
    if (isLocked) return;
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks: value,
      },
    }));
  };

  const handleSave = () => {
    setFeedback(null);

    // Validate marks
    const payloadResults: Array<{ studentId: string; obtainedMarks: number; remarks?: string }> = [];

    for (const st of students) {
      const entry = marksState[st.id];
      if (!entry || entry.obtainedMarks.trim() === "") {
        setFeedback({
          type: "error",
          text: `Please enter marks for ${st.name} (0 to ${test.totalMarks}).`,
        });
        return;
      }

      const val = parseFloat(entry.obtainedMarks);
      if (isNaN(val) || val < 0 || val > test.totalMarks) {
        setFeedback({
          type: "error",
          text: `Marks for ${st.name} must be between 0 and ${test.totalMarks}.`,
        });
        return;
      }

      payloadResults.push({
        studentId: st.id,
        obtainedMarks: val,
        remarks: entry.remarks || undefined,
      });
    }

    startTransition(async () => {
      try {
        await submitTestMarksAction({
          testId: test.id,
          results: payloadResults,
        });

        setFeedback({
          type: "success",
          text: `Marks saved successfully for ${payloadResults.length} students!`,
        });
      } catch (err: any) {
        setFeedback({
          type: "error",
          text: err.message || "Failed to save marks.",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Test Header */}
      <Card className="shadow-1">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-semibold text-slate-900">{test.title}</h2>
                <Badge
                  variant={test.status === "PUBLISHED" ? "default" : "secondary"}
                  className={test.status === "PUBLISHED" ? "bg-emerald-600 text-white" : ""}
                >
                  {test.status}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Batch: <strong>{test.batch.class.name} {test.batch.name}</strong> • Subject: <strong>{test.subject}</strong> • Total Marks: <strong>{test.totalMarks}</strong> • Date: <strong>{test.date}</strong>
              </p>
            </div>

            {test.status === "PUBLISHED" && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800 text-xs py-1 px-3 flex items-center">
                <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                Published by Admin
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lock Notice */}
      {isLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3 text-amber-800">
          <Lock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm">
            <strong className="font-semibold">Marks are locked.</strong>
            <p className="mt-0.5">
              This test has been officially published by the administration. In accordance with academy policy, faculty marks can no longer be edited directly. Corrections require administrator authorization with an audit reason.
            </p>
          </div>
        </div>
      )}

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
            <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Marks Table */}
      <Card className="shadow-1 overflow-hidden">
        <CardHeader className="py-4 border-b bg-slate-50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold text-slate-900">
              Student Marks Roster
            </CardTitle>
            <CardDescription className="text-xs">
              Enter student score (0 to {test.totalMarks}). Grade and percentage calculate automatically.
            </CardDescription>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {students.length} Enrolled Students
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {students.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Users className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              No active students enrolled in this batch.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-slate-100/75 text-slate-600 font-semibold">
                    <th className="py-3 px-4 w-12">#</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4 w-36">Obtained Marks</th>
                    <th className="py-3 px-4 text-center w-24">Percentage</th>
                    <th className="py-3 px-4 text-center w-20">Grade</th>
                    <th className="py-3 px-4">Faculty Remarks</th>
                    {test.status === "PUBLISHED" && (
                      <th className="py-3 px-4 text-right w-28">Result Card</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st, idx) => {
                    const entry = marksState[st.id] || { obtainedMarks: "", remarks: "" };
                    const val = parseFloat(entry.obtainedMarks);
                    const hasValidMarks = !isNaN(val) && val >= 0 && val <= test.totalMarks;
                    const pct = hasValidMarks ? calculatePercentage(val, test.totalMarks) : null;
                    const grade = pct !== null ? calculateGrade(pct) : null;

                    return (
                      <tr key={st.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {String(idx + 1).padStart(2, "0")}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{st.name}</div>
                          <div className="text-xs font-mono text-slate-500">
                            {st.admissionNo}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-1.5">
                            <Input
                              type="number"
                              min="0"
                              max={test.totalMarks}
                              step="0.5"
                              value={entry.obtainedMarks}
                              onChange={(e) => handleMarkChange(st.id, e.target.value)}
                              disabled={isLocked || isSaving}
                              placeholder={`0 - ${test.totalMarks}`}
                              className="h-8 w-24 text-xs font-mono font-semibold"
                            />
                            <span className="text-slate-400 font-mono text-xs">/ {test.totalMarks}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-semibold">
                          {pct !== null ? `${pct}%` : "—"}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {grade !== null ? (
                            <Badge
                              variant="outline"
                              className={`text-xs font-mono font-semibold py-0.5 px-2 ${
                                grade === "A+" || grade === "A"
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : grade === "F"
                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }`}
                            >
                              {grade}
                            </Badge>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <Input
                            placeholder="Optional feedback..."
                            value={entry.remarks}
                            onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                            disabled={isLocked || isSaving}
                            className="h-8 text-xs bg-white"
                          />
                        </td>

                        {test.status === "PUBLISHED" && (
                          <td className="py-3 px-4 text-right">
                            <a
                              href={`/api/tests/${test.id}/results/${st.id}/card`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                              title="Download Official Result Card PDF"
                            >
                              <Download className="h-3.5 w-3.5 mr-1" />
                              PDF
                            </a>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>

        {!isLocked && students.length > 0 && (
          <div className="p-4 bg-slate-50 border-t flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-500">
              Marks remain editable until published by an administrator.
            </span>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-slate-900 text-white flex items-center space-x-1.5"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin mr-1.5" />
                  <span>Saving Marks...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  <span>Submit Marks ({students.length} Students)</span>
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
