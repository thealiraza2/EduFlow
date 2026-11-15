/**
 * EduFlow - Online Test Engine & Auto-Grading Module (Phase 12)
 *
 * Requirements:
 * - Server-side timer calculation (never trust client clock)
 * - Auto-grading for MCQs: score = correct * marks - wrong * negativeMarking (floored at 0)
 * - SHORT answers routed to teacher marking queue
 * - Leaderboard ranked by score DESC, then time taken ASC (published only after test closes)
 * - Anti-cheat tab-switch tracking (flagged if > 5 switches, honest audit, never auto-fail)
 */

import { db } from "@/lib/db";
import { QuestionType, AttemptStatus, Prisma } from "@prisma/client";

export interface EvaluatedAnswer {
  questionId: string;
  answer: string;
  isCorrect: boolean | null;
  marksAwarded: number;
}

export interface GradingResult {
  finalScore: number;
  scoreMinor: number;
  totalPossibleMarks: number;
  evaluatedAnswers: EvaluatedAnswer[];
  hasShortQuestions: boolean;
  status: AttemptStatus;
}

/**
 * Calculates auto-grading score for MCQ questions with negative marking.
 *
 * Math Formula:
 * - Correct MCQ: +question.marks
 * - Wrong MCQ: -negativeMarking
 * - Unattempted MCQ: 0 (no penalty for skipping)
 * - SHORT question: deferred to teacher marking (marksAwarded = 0, isCorrect = null)
 * - Total Score: floored at 0 (cannot be negative)
 */
export function calculateTestGrading(
  questions: Array<{
    id: string;
    type: QuestionType;
    marks: number;
    correctAnswer: string;
  }>,
  answers: Record<string, string>,
  negativeMarking: number = 0
): GradingResult {
  let totalScore = 0;
  let totalPossibleMarks = 0;
  let hasShortQuestions = false;
  const evaluatedAnswers: EvaluatedAnswer[] = [];

  for (const q of questions) {
    totalPossibleMarks += q.marks;
    const rawAnswer = answers[q.id];
    const studentAnswer = rawAnswer !== undefined && rawAnswer !== null ? String(rawAnswer).trim() : "";

    if (q.type === "MCQ") {
      if (!studentAnswer) {
        // Skipped/unanswered MCQ: 0 marks
        evaluatedAnswers.push({
          questionId: q.id,
          answer: "",
          isCorrect: false,
          marksAwarded: 0,
        });
      } else if (studentAnswer.toLowerCase() === q.correctAnswer.trim().toLowerCase()) {
        // Correct MCQ
        totalScore += q.marks;
        evaluatedAnswers.push({
          questionId: q.id,
          answer: studentAnswer,
          isCorrect: true,
          marksAwarded: q.marks,
        });
      } else {
        // Wrong MCQ: deduct negativeMarking
        const penalty = Math.abs(negativeMarking);
        totalScore -= penalty;
        evaluatedAnswers.push({
          questionId: q.id,
          answer: studentAnswer,
          isCorrect: false,
          marksAwarded: -penalty,
        });
      }
    } else if (q.type === "SHORT") {
      hasShortQuestions = true;
      // SHORT question awaits manual teacher grading
      evaluatedAnswers.push({
        questionId: q.id,
        answer: studentAnswer,
        isCorrect: null,
        marksAwarded: 0,
      });
    }
  }

  // Floor score at 0: no negative scores
  const finalScore = Math.max(0, Math.round(totalScore * 100) / 100);
  const scoreMinor = Math.round(finalScore * 100);
  const status = hasShortQuestions ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED;

  return {
    finalScore,
    scoreMinor,
    totalPossibleMarks,
    evaluatedAnswers,
    hasShortQuestions,
    status,
  };
}

export interface LeaderboardRow {
  rank: number;
  studentId: string;
  studentName: string;
  admissionNo: string;
  score: number;
  scoreMinor: number;
  totalMarks: number;
  percentage: number;
  timeTakenSeconds: number;
  timeTakenFormatted: string;
  status: AttemptStatus;
  tabSwitchCount: number;
  isFlagged: boolean;
  submittedAt: string | null;
}

/**
 * Computes leaderboard rankings for a test.
 * Ranked primarily by score DESC, and secondarily by time taken ASC (least time wins ties).
 */
export function rankLeaderboardAttempts(
  attempts: Array<{
    id: string;
    studentId: string;
    student: { name: string; admissionNo: string };
    score: number;
    scoreMinor: number;
    startedAt: Date;
    submittedAt: Date | null;
    status: AttemptStatus;
    tabSwitchCount: number;
  }>,
  totalMarks: number
): LeaderboardRow[] {
  // Sort attempts: score DESC, timeTaken ASC
  const sorted = [...attempts].sort((a, b) => {
    // Primary: Score descending
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Secondary: Time taken ascending (in seconds)
    const timeA = a.submittedAt
      ? Math.max(0, Math.floor((a.submittedAt.getTime() - a.startedAt.getTime()) / 1000))
      : 999999;
    const timeB = b.submittedAt
      ? Math.max(0, Math.floor((b.submittedAt.getTime() - b.startedAt.getTime()) / 1000))
      : 999999;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // Tertiary: submitted earlier
    const submitA = a.submittedAt ? a.submittedAt.getTime() : 0;
    const submitB = b.submittedAt ? b.submittedAt.getTime() : 0;
    return submitA - submitB;
  });

  return sorted.map((att, idx) => {
    const timeTakenSeconds = att.submittedAt
      ? Math.max(0, Math.floor((att.submittedAt.getTime() - att.startedAt.getTime()) / 1000))
      : 0;

    const mins = Math.floor(timeTakenSeconds / 60);
    const secs = timeTakenSeconds % 60;
    const timeTakenFormatted = `${mins}m ${secs}s`;

    const percentage = totalMarks > 0 ? Math.round((att.score / totalMarks) * 1000) / 10 : 0;

    return {
      rank: idx + 1,
      studentId: att.studentId,
      studentName: att.student.name,
      admissionNo: att.student.admissionNo,
      score: att.score,
      scoreMinor: att.scoreMinor,
      totalMarks,
      percentage,
      timeTakenSeconds,
      timeTakenFormatted,
      status: att.status,
      tabSwitchCount: att.tabSwitchCount,
      isFlagged: att.tabSwitchCount > 5, // Flagged if > 5 tab switches
      submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
    };
  });
}
