"use client";

import React, { useState } from "react";
import {
  gradeShortQuestionAction,
  closeTestAndPublishLeaderboardAction,
} from "@/lib/actions/online-tests";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Trophy,
  Loader2,
  FileCheck2,
  Lock,
  Unlock,
} from "lucide-react";
import Link from "next/link";

interface PendingShortAnswer {
  id: string;
  studentName: string;
  admissionNo: string;
  testId: string;
  testTitle: string;
  questionText: string;
  maxMarks: number;
  answerText: string;
  submittedAt: string;
}

interface TestLeaderboardSummary {
  testId: string;
  testTitle: string;
  batchName: string;
  isClosed: boolean;
  totalAttempts: number;
  flaggedAttempts: number;
  attempts: Array<{
    id: string;
    studentName: string;
    admissionNo: string;
    score: number;
    totalMarks: number;
    timeTakenFormatted: string;
    tabSwitchCount: number;
    isFlagged: boolean;
    status: string;
  }>;
}

interface Props {
  pendingAnswers: PendingShortAnswer[];
  testsSummary: TestLeaderboardSummary[];
}

export function TeacherMarkingManager({ pendingAnswers, testsSummary }: Props) {
  const [activeTab, setActiveTab] = useState<"marking" | "leaderboard">("marking");
  const [awardedMarks, setAwardedMarks] = useState<Record<string, number>>({});
  const [loadingAnswerId, setLoadingAnswerId] = useState<string | null>(null);
  const [closingTestId, setClosingTestId] = useState<string | null>(null);

  async function handleGrade(answerId: string, maxMarks: number) {
    const marks = awardedMarks[answerId] ?? maxMarks;
    try {
      setLoadingAnswerId(answerId);
      await gradeShortQuestionAction({
        answerId,
        marksAwarded: marks,
      });
      window.location.reload();
    } catch (err: any) {
      alert("Failed to save grade: " + err.message);
    } finally {
      setLoadingAnswerId(null);
    }
  }

  async function handleCloseTest(testId: string) {
    if (!confirm("Are you sure you want to close this test? The official leaderboard will be published to all students.")) {
      return;
    }
    try {
      setClosingTestId(testId);
      await closeTestAndPublishLeaderboardAction(testId);
      window.location.reload();
    } catch (err: any) {
      alert("Failed to close test: " + err.message);
    } finally {
      setClosingTestId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("marking")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === "marking"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Subjective Marking Queue</span>
          {pendingAnswers.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs py-0 px-1.5">
              {pendingAnswers.length} Pending
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("leaderboard")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 flex items-center space-x-2 transition-colors ${
            activeTab === "leaderboard"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Online Tests & Leaderboards ({testsSummary.length})</span>
        </button>
      </div>

      {/* Tab 1: Subjective Marking */}
      {activeTab === "marking" && (
        <div className="space-y-4">
          {pendingAnswers.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent className="space-y-2">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-semibold text-slate-900">Marking Queue Clear</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  All submitted subjective questions have been evaluated. MCQs are graded automatically.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingAnswers.map((item) => (
                <Card key={item.id} className="shadow-1 border">
                  <CardHeader className="pb-3 pt-4 px-5 bg-slate-50/50 border-b flex flex-row items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm">{item.studentName}</span>
                        <Badge variant="outline" className="font-mono text-xs">
                          {item.admissionNo}
                        </Badge>
                      </div>
                      <span className="text-xs text-slate-500">Test: {item.testTitle}</span>
                    </div>

                    <Badge variant="secondary" className="text-xs font-mono">
                      Max: {item.maxMarks} Marks
                    </Badge>
                  </CardHeader>

                  <CardContent className="p-5 space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                        Question Prompt
                      </span>
                      <p className="text-sm font-medium text-slate-800 mt-0.5">{item.questionText}</p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                        Student's Written Response:
                      </span>
                      <p className="text-xs font-mono text-slate-800 whitespace-pre-wrap">
                        {item.answerText || "(No answer entered)"}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center space-x-2">
                        <label className="text-xs font-semibold text-slate-700">Award Marks:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={item.maxMarks}
                          value={awardedMarks[item.id] ?? item.maxMarks}
                          onChange={(e) =>
                            setAwardedMarks({
                              ...awardedMarks,
                              [item.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-20 px-2.5 py-1 text-sm font-mono font-semibold rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <span className="text-xs text-slate-400">/ {item.maxMarks}</span>
                      </div>

                      <button
                        onClick={() => handleGrade(item.id, item.maxMarks)}
                        disabled={loadingAnswerId === item.id}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-1 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        {loadingAnswerId === item.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                        )}
                        <span>Save & Finalize Score</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Test Leaderboards & Publishing Controls */}
      {activeTab === "leaderboard" && (
        <div className="space-y-6">
          {testsSummary.map((test) => (
            <Card key={test.testId} className="shadow-1 border">
              <CardHeader className="pb-3 pt-4 px-5 bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-slate-900 text-base">{test.testTitle}</h3>
                    <Badge
                      variant={test.isClosed ? "default" : "secondary"}
                      className={`text-xs ${test.isClosed ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800 border-amber-300"}`}
                    >
                      {test.isClosed ? "Leaderboard Published" : "Active Assessment"}
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-500">Batch: {test.batchName}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <Link
                    href={`/student/test/${test.testId}`}
                    target="_blank"
                    className="text-xs px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-100 font-semibold text-slate-700"
                  >
                    View Test
                  </Link>

                  {!test.isClosed && (
                    <button
                      onClick={() => handleCloseTest(test.testId)}
                      disabled={closingTestId === test.testId}
                      className="text-xs px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-1 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      {closingTestId === test.testId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Lock className="h-3.5 w-3.5" />
                      )}
                      <span>Close Test & Publish Leaderboard</span>
                    </button>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-slate-50/50 text-slate-500 font-semibold text-left">
                        <th className="py-2.5 px-4">Student</th>
                        <th className="py-2.5 px-3 text-right">Score</th>
                        <th className="py-2.5 px-3 text-right">Time Taken</th>
                        <th className="py-2.5 px-3 text-center">Anti-Cheat Audit</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {test.attempts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-slate-400">
                            No student attempts submitted yet.
                          </td>
                        </tr>
                      ) : (
                        test.attempts.map((att) => (
                          <tr key={att.id} className="hover:bg-slate-50/50">
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-slate-900 block">{att.studentName}</span>
                              <span className="font-mono text-xs text-slate-400">{att.admissionNo}</span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                              {att.score} / {att.totalMarks}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {att.timeTakenFormatted}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              {att.isFlagged ? (
                                <Badge variant="destructive" className="text-xs py-0 px-1.5 animate-pulse">
                                  Flagged ({att.tabSwitchCount} switches)
                                </Badge>
                              ) : att.tabSwitchCount > 0 ? (
                                <span className="text-xs text-slate-500 font-mono">
                                  {att.tabSwitchCount} tab switch{att.tabSwitchCount > 1 ? "es" : ""}
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 font-mono">Clean (0)</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge variant="outline" className="text-xs">
                                {att.status}
                              </Badge>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
