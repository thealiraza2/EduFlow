"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  startOnlineTestAttemptAction,
  submitOnlineTestAttemptAction,
  recordTabSwitchAction,
} from "@/lib/actions/online-tests";
import { LeaderboardRow } from "@/lib/online-tests";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Send,
  Loader2,
  HelpCircle,
  EyeOff,
} from "@/components/icons";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface QuestionItem {
  id: string;
  type: "MCQ" | "SHORT";
  text: string;
  options: string[] | null;
  marks: number;
  order: number;
}

interface RunnerProps {
  testId: string;
  testTitle: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  negativeMarking: number;
  isClosed: boolean;
  leaderboard: LeaderboardRow[];
  initialAttempt?: {
    id: string;
    status: string;
    score: number;
    submittedAt: string | null;
    tabSwitchCount: number;
  } | null;
}

export function OnlineTestRunner({
  testId,
  testTitle,
  subject,
  totalMarks,
  durationMinutes,
  negativeMarking,
  isClosed,
  leaderboard,
  initialAttempt,
}: RunnerProps) {
  // Test Lifecycle state: "intro" | "active" | "completed"
  const [phase, setPhase] = useState<"intro" | "active" | "completed">(
    initialAttempt && (initialAttempt.status === "SUBMITTED" || initialAttempt.status === "GRADED")
      ? "completed"
      : "intro"
  );

  const [attemptId, setAttemptId] = useState<string | null>(initialAttempt?.id || null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(durationMinutes * 60);
  const [tabSwitchCount, setTabSwitchCount] = useState(initialAttempt?.tabSwitchCount || 0);
  const [isStarting, setIsStarting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{
    score: number;
    totalMarks: number;
    status: string;
    hasShortQuestions?: boolean;
    tabSwitchCount: number;
  } | null>(
    initialAttempt
      ? {
          score: initialAttempt.score,
          totalMarks,
          status: initialAttempt.status,
          tabSwitchCount: initialAttempt.tabSwitchCount,
        }
      : null
  );

  const answersRef = useRef(answers);
  answersRef.current = answers;

  const attemptIdRef = useRef(attemptId);
  attemptIdRef.current = attemptId;

  const tabSwitchRef = useRef(tabSwitchCount);
  tabSwitchRef.current = tabSwitchCount;

  // 1. Anti-Cheat: Listen for tab-switching and window blur
  useEffect(() => {
    if (phase !== "active" || !attemptId) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prev) => {
          const next = prev + 1;
          recordTabSwitchAction(attemptIdRef.current!);
          return next;
        });
      }
    };

    const handleWindowBlur = () => {
      setTabSwitchCount((prev) => {
        const next = prev + 1;
        recordTabSwitchAction(attemptIdRef.current!);
        return next;
      });
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [phase, attemptId]);

  // 2. Server-Synced Countdown Timer
  useEffect(() => {
    if (phase !== "active") return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-submit immediately on timeout
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // Handler: Start or Resume Test
  async function handleStart() {
    try {
      setIsStarting(true);
      const res = await startOnlineTestAttemptAction({ testId });

      if (res.alreadyCompleted) {
        setFinalResult({
          score: res.score || 0,
          totalMarks: res.totalMarks || totalMarks,
          status: res.status || "GRADED",
          tabSwitchCount: 0,
        });
        setPhase("completed");
        return;
      }

      setAttemptId(res.attemptId);
      setQuestions(res.questions as QuestionItem[]);
      setRemainingSeconds(res.remainingSeconds ?? durationMinutes * 60);
      if (res.existingAnswers) {
        setAnswers(res.existingAnswers);
      }
      setPhase("active");
    } catch (err: any) {
      alert(err.message || "Failed to start test attempt.");
    } finally {
      setIsStarting(false);
    }
  }

  // Handler: Submit
  async function handleSubmit(isAuto: boolean = false) {
    if (!attemptIdRef.current || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const res = await submitOnlineTestAttemptAction({
        attemptId: attemptIdRef.current,
        answers: answersRef.current,
        tabSwitchCount: tabSwitchRef.current,
      });

      setFinalResult({
        score: res.score,
        totalMarks: res.totalMarks,
        status: res.status,
        hasShortQuestions: res.hasShortQuestions,
        tabSwitchCount: tabSwitchRef.current,
      });

      setPhase("completed");
    } catch (err: any) {
      console.error("Submission failed:", err);
      if (!isAuto) {
        alert("Failed to submit test: " + err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAutoSubmit() {
    handleSubmit(true);
  }

  // Timer formatting
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const isTimeCritical = remainingSeconds <= 60;

  // Answer tracking
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.trim()).length;

  // --- PHASE 1: INTRO SCREEN ---
  if (phase === "intro") {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border shadow-1 p-6 sm:p-8 space-y-6">
        <div className="border-b pb-4">
          <Badge variant="outline" className="text-xs uppercase tracking-wider text-slate-500 mb-2">
            Online Assessment
          </Badge>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-slate-900">{testTitle}</h1>
          <p className="text-sm text-slate-500 mt-1">
            Subject: <strong>{subject}</strong> | Total Marks: <strong>{totalMarks}</strong>
          </p>
        </div>

        {/* Rules Box */}
        <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-3.5 text-xs text-slate-700">
          <h3 className="font-semibold text-slate-900 text-sm flex items-center space-x-2">
            <HelpCircle className="h-4 w-4 text-emerald-600" />
            <span>Instructions & Evaluation Rules</span>
          </h3>

          <ul className="space-y-2 list-disc list-inside text-slate-600">
            <li>
              <strong>Timed Test:</strong> You have <strong>{durationMinutes} minutes</strong> to complete all questions.
            </li>
            <li>
              <strong>Server-Side Timer:</strong> The countdown is enforced strictly on the server. Your test will automatically submit upon timeout.
            </li>
            <li>
              <strong>Negative Marking:</strong>{" "}
              {negativeMarking > 0 ? (
                <span className="text-rose-600 font-semibold">
                  {negativeMarking} marks deducted for every incorrect MCQ. Unanswered questions receive 0.
                </span>
              ) : (
                <span>No negative marking for this assessment.</span>
              )}
            </li>
            <li>
              <strong>Single Attempt:</strong> Exactly one attempt is allowed per student. Second attempts are strictly blocked.
            </li>
          </ul>
        </div>

        {/* Anti-Cheat Disclosure */}
        <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-2.5">
          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Anti-Cheat Tab Monitor:</strong> The browser tab is continuously monitored. Switching away or blurring the window will be logged on your faculty submission report.
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/student"
            className="flex-1 py-3 px-4 rounded-xl font-medium text-xs border border-slate-300 hover:bg-slate-50 text-slate-700 transition-all flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={handleStart}
            disabled={isStarting}
            className="flex-1 py-3 px-4 rounded-xl font-semibold text-xs bg-slate-900 hover:bg-slate-800 text-white shadow-2 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Initializing Server Session...</span>
              </>
            ) : (
              <>
                <span>Begin Assessment</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  // --- PHASE 3: COMPLETED SCREEN ---
  if (phase === "completed") {
    const score = finalResult?.score ?? 0;
    const pct = totalMarks > 0 ? Math.round((score / totalMarks) * 1000) / 10 : 0;

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Score Card */}
        <div className="bg-white rounded-2xl border shadow-1 p-6 sm:p-8 text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </div>

          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            <span>{testTitle}</span> • <span>{subject}</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 mt-1">Assessment Submitted!</h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Your answers have been securely recorded. Auto-graded MCQ marks are computed instantly.
          </p>

          <div className="bg-slate-50 border rounded-xl p-5 max-w-sm mx-auto space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Final Obtained Score
            </span>
            <div className="text-4xl font-semibold font-mono text-emerald-600">
              {score} <span className="text-lg text-slate-400 font-normal">/ {totalMarks}</span>
            </div>
            <div className="text-xs text-slate-600 font-semibold">{pct}% Overall Score</div>
          </div>

          {finalResult?.hasShortQuestions && (
            <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200 inline-block">
              ℹ️ Subjective SHORT questions have been submitted to the faculty marking queue.
            </div>
          )}

          {tabSwitchCount > 0 && (
            <div className="text-xs text-slate-400">
              Audited Tab Switches: <strong>{tabSwitchCount}</strong> {tabSwitchCount > 5 ? "(Flagged)" : ""}
            </div>
          )}
        </div>

        {/* Leaderboard Section */}
        <div className="bg-white rounded-2xl border shadow-1 p-6 space-y-4">
          <div className="flex justify-between items-center border-b pb-3">
            <div className="flex items-center space-x-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <h3 className="text-lg font-semibold text-slate-900">Batch Leaderboard</h3>
            </div>
            <Badge variant={isClosed ? "default" : "secondary"} className="text-xs">
              {isClosed ? "Official Ranks Published" : "Active Assessment (Hidden)"}
            </Badge>
          </div>

          {!isClosed ? (
            <div className="py-8 text-center text-slate-500 space-y-2">
              <EyeOff className="h-8 w-8 text-slate-300 mx-auto" />
              <p className="text-sm font-semibold text-slate-700">Leaderboard is currently sealed</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                To prevent unfair advantage, class rankings and positions will be published automatically once the faculty officially closes this test.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-slate-50 text-slate-600 text-left font-semibold">
                    <th className="py-2.5 px-3 w-16">Rank</th>
                    <th className="py-2.5 px-3">Student Name</th>
                    <th className="py-2.5 px-3">Roll / ID</th>
                    <th className="py-2.5 px-3 text-right">Score</th>
                    <th className="py-2.5 px-3 text-right">Time Taken</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-slate-400">
                        No submissions recorded for this test.
                      </td>
                    </tr>
                  ) : (
                    leaderboard.map((row) => (
                      <tr
                        key={row.studentId}
                        className={`hover:bg-slate-50/60 ${row.rank === 1 ? "bg-amber-50/40 font-semibold" : ""}`}
                      >
                        <td className="py-2.5 px-3 font-mono font-semibold">
                          {row.rank === 1 ? "🥇 #1" : row.rank === 2 ? "🥈 #2" : row.rank === 3 ? "🥉 #3" : `#${row.rank}`}
                        </td>
                        <td className="py-2.5 px-3 text-slate-900">{row.studentName}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-500">{row.admissionNo}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-700">
                          {row.score} / {row.totalMarks}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          {row.timeTakenFormatted}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <Badge variant="outline" className="text-xs py-0">
                            {row.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          <div className="pt-2 text-center">
            <Link
              href="/student"
              className="text-xs text-slate-600 hover:text-slate-900 font-semibold inline-flex items-center space-x-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 shadow-1"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Student Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // --- PHASE 2: ACTIVE ASSESSMENT RUNNER ---
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Sticky Top Status Bar */}
      <div className="sticky top-2 z-20 bg-slate-900 text-white rounded-xl shadow-2 px-4 py-3 flex justify-between items-center">
        <div>
          <div className="text-xs font-semibold text-slate-300 truncate max-w-xs">{testTitle}</div>
          <div className="text-xs text-slate-400">
            Answered: <strong>{answeredCount}</strong> of {questions.length} questions
          </div>
        </div>

        {/* Server Countdown Clock */}
        <div className="flex items-center space-x-3">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg font-mono font-semibold text-sm ${
              isTimeCritical ? "bg-rose-600 text-white animate-pulse" : "bg-slate-800 text-emerald-400"
            }`}
          >
            <Clock className="h-4 w-4" />
            <span>{timeFormatted}</span>
          </div>

          <button
            onClick={() => handleSubmit(false)}
            disabled={isSubmitting}
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg shadow transition-colors flex items-center space-x-1 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            <span>Submit</span>
          </button>
        </div>
      </div>

      {/* Tab Switch Alert Banner */}
      {tabSwitchCount > 0 && (
        <div
          className={`p-2.5 rounded-lg text-xs flex items-center space-x-2 border ${
            tabSwitchCount > 5
              ? "bg-rose-50 border-rose-300 text-rose-800 font-semibold"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>
            {tabSwitchCount > 5
              ? `⚠️ Attention: High tab switch activity (${tabSwitchCount} times) has flagged your attempt for faculty review.`
              : `Tab switch detected (${tabSwitchCount} time${tabSwitchCount > 1 ? "s" : ""}). Please stay on this window.`}
          </span>
        </div>
      )}

      {/* Question Number Pills */}
      <div className="bg-white rounded-xl border shadow-1 p-3 flex flex-wrap gap-1.5">
        {questions.map((q, idx) => {
          const isAnswered = !!answers[q.id]?.trim();
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold font-mono transition-all ${
                isCurrent
                  ? "bg-slate-900 text-white ring-2 ring-slate-900 ring-offset-1"
                  : isAnswered
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Active Question Card */}
      {currentQuestion && (
        <div className="bg-white rounded-2xl border shadow-1 p-6 space-y-6">
          <div className="flex justify-between items-start">
            <Badge variant="outline" className="text-xs font-mono font-semibold">
              Question {currentIndex + 1} of {questions.length} • {currentQuestion.type}
            </Badge>
            <span className="text-xs text-slate-500 font-semibold font-mono">
              Marks: {currentQuestion.marks}
            </span>
          </div>

          <h2 className="text-lg font-semibold text-slate-900 leading-snug">{currentQuestion.text}</h2>

          {/* MCQ Options */}
          {currentQuestion.type === "MCQ" && currentQuestion.options && (
            <div className="space-y-2.5">
              {currentQuestion.options.map((option, optIdx) => {
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <label
                    key={optIdx}
                    className={`flex items-center space-x-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-1"
                        : "bg-slate-50/70 border-slate-200 text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option}
                      checked={isSelected}
                      onChange={() =>
                        setAnswers({ ...answers, [currentQuestion.id]: option })
                      }
                      className="sr-only"
                    />
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-semibold font-mono border ${
                        isSelected
                          ? "bg-white text-slate-900 border-white"
                          : "border-slate-300 text-slate-500"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm font-medium">{option}</span>
                  </label>
                );
              })}
            </div>
          )}

          {/* SHORT Written Response */}
          {currentQuestion.type === "SHORT" && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 block">
                Type your written response (max 500 characters):
              </label>
              <textarea
                rows={4}
                value={answers[currentQuestion.id] || ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [currentQuestion.id]: e.target.value })
                }
                placeholder="Write your answer clearly..."
                className="w-full text-sm p-3.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-slate-900 font-sans"
              />
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
              disabled={currentIndex === 0}
              className="py-2 px-4 rounded-lg text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center space-x-1"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                className="py-2 px-4 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 flex items-center space-x-1 shadow-1"
              >
                <span>Next</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </button>
            ) : (
              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting}
                className="py-2 px-5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center space-x-1 shadow-1 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                ) : (
                  <Send className="h-3.5 w-3.5 mr-1" />
                )}
                <span>Finalize & Submit Test</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
