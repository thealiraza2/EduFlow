import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { OnlineTestRunner } from "@/components/student/OnlineTestRunner";
import { rankLeaderboardAttempts } from "@/lib/online-tests";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function StudentTestPage({ params }: PageProps) {
  const resolvedParams = await params;
  const testId = resolvedParams.id;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/student/test/${testId}`);
  }

  // Fetch test
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      batch: true,
      attempts: {
        include: {
          student: true,
        },
      },
    },
  });

  if (!test) {
    notFound();
  }

  // Resolve current student ID
  let currentStudentId: string | null = null;

  if (session.user.role === Role.STUDENT) {
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });
    if (student) currentStudentId = student.id;
  } else if (session.user.role === Role.PARENT) {
    const child = await db.student.findFirst({
      where: { guardianUserId: session.user.id },
    });
    if (child) currentStudentId = child.id;
  } else {
    // Teacher or Admin testing mode
    const firstStudent = await db.student.findFirst({
      where: { academyId: test.academyId },
    });
    if (firstStudent) currentStudentId = firstStudent.id;
  }

  // Check if current student has an existing attempt
  let initialAttempt = null;
  if (currentStudentId) {
    const att = await db.testAttempt.findUnique({
      where: {
        testId_studentId: {
          testId: test.id,
          studentId: currentStudentId,
        },
      },
    });

    if (att) {
      initialAttempt = {
        id: att.id,
        status: att.status,
        score: att.score,
        submittedAt: att.submittedAt ? att.submittedAt.toISOString() : null,
        tabSwitchCount: att.tabSwitchCount,
      };
    }
  }

  // Rank leaderboard across all attempts
  const rankedLeaderboard = rankLeaderboardAttempts(
    test.attempts.map((a) => ({
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
    test.totalMarks
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <OnlineTestRunner
        testId={test.id}
        testTitle={test.title}
        subject={test.subject}
        totalMarks={test.totalMarks}
        durationMinutes={test.durationMinutes || 30}
        negativeMarking={test.negativeMarking || 0}
        isClosed={test.isClosed}
        leaderboard={rankedLeaderboard}
        initialAttempt={initialAttempt}
      />
    </div>
  );
}
