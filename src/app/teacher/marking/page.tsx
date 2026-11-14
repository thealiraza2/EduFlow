import React from "react";
import { requireRole } from "@/lib/auth";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { TeacherMarkingManager } from "@/components/teacher/TeacherMarkingManager";
import { rankLeaderboardAttempts } from "@/lib/online-tests";
import { FileCheck, Trophy } from "lucide-react";

export default async function TeacherMarkingPage() {
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);
  const tenant = await requireTenant();

  // 1. Fetch pending SHORT answers across tests in this academy
  const pendingAnswers = await db.studentAnswer.findMany({
    where: {
      isCorrect: null,
      question: { type: "SHORT" },
      attempt: {
        academyId: tenant.academyId,
      },
    },
    include: {
      question: true,
      attempt: {
        include: {
          student: true,
          test: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const formattedPending = pendingAnswers.map((ans) => ({
    id: ans.id,
    studentName: ans.attempt.student.name,
    admissionNo: ans.attempt.student.admissionNo,
    testId: ans.attempt.test.id,
    testTitle: ans.attempt.test.title,
    questionText: ans.question.text,
    maxMarks: ans.question.marks,
    answerText: ans.answer,
    submittedAt: ans.attempt.submittedAt ? ans.attempt.submittedAt.toISOString() : ans.createdAt.toISOString(),
  }));

  // 2. Fetch all online tests in this academy with attempts for leaderboards
  const onlineTests = await db.test.findMany({
    where: {
      academyId: tenant.academyId,
      durationMinutes: { not: null },
    },
    include: {
      batch: { include: { class: true } },
      attempts: {
        include: { student: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const testsSummary = onlineTests.map((t) => {
    const ranked = rankLeaderboardAttempts(
      t.attempts.map((a) => ({
        id: a.id,
        studentId: a.studentId,
        student: {
          name: a.student.name,
          admissionNo: a.student.admissionNo,
        },
        score: a.score,
        scoreMinor: a.scoreMinor,
        startedAt: a.startedAt,
        submittedAt: a.submittedAt,
        status: a.status,
        tabSwitchCount: a.tabSwitchCount,
      })),
      t.totalMarks
    );

    const flaggedCount = t.attempts.filter((a) => a.tabSwitchCount > 5).length;

    return {
      testId: t.id,
      testTitle: t.title,
      batchName: `${t.batch.class.name} ${t.batch.name}`,
      isClosed: t.isClosed,
      totalAttempts: t.attempts.length,
      flaggedAttempts: flaggedCount,
      attempts: ranked.map((r) => ({
        id: r.studentId,
        studentName: r.studentName,
        admissionNo: r.admissionNo,
        score: r.score,
        totalMarks: r.totalMarks,
        timeTakenFormatted: r.timeTakenFormatted,
        tabSwitchCount: r.tabSwitchCount,
        isFlagged: r.isFlagged,
        status: r.status,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
          <FileCheck className="h-6 w-6 mr-2 text-emerald-600" />
          Online Test Evaluation & Leaderboards
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Grade subjective short questions, monitor anti-cheat tab audits, and publish official test leaderboards.
        </p>
      </div>

      <TeacherMarkingManager
        pendingAnswers={formattedPending}
        testsSummary={testsSummary}
      />
    </div>
  );
}
