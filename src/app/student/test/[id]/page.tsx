import React from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { OnlineTestRunner } from "@/components/student/OnlineTestRunner";
import { rankLeaderboardAttempts } from "@/lib/online-tests";

interface PageProps {
  params: { id: string } | Promise<{ id: string }>;
}

export default async function StudentTestPage({ params }: PageProps) {
  const resolvedParams = await Promise.resolve(params);
  const testId = resolvedParams.id;

  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/student/test/${testId}`);
  }

  // Fetch test
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      batch: { include: { class: true } },
      questions: { orderBy: { order: "asc" } },
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

  // Tenant isolation: never reveal another academy's test or leaderboard.
  if (session.user.role !== Role.SUPER_ADMIN && session.user.academyId !== test.academyId) {
    notFound();
  }

  // Resolve current student ID (only an explicitly linked record; never auto-link).
  let currentStudentId: string | null = null;

  if (session.user.role === Role.STUDENT) {
    const student = await db.student.findFirst({
      where: { userId: session.user.id, academyId: test.academyId },
    });
    if (student) currentStudentId = student.id;
  } else if (session.user.role === Role.PARENT) {
    const child = await db.student.findFirst({
      where: { guardianUserId: session.user.id, academyId: test.academyId },
    });
    if (child) currentStudentId = child.id;
  } else if (session.user.role === Role.TEACHER) {
    // Teachers may only view tests for batches they teach.
    const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
    if (!teacher || test.batch.teacherId !== teacher.id) {
      notFound();
    }
  }

  // Students and parents may only open tests for batches the student is enrolled in.
  if (session.user.role === Role.STUDENT || session.user.role === Role.PARENT) {
    const enrollment = currentStudentId
      ? await db.enrollment.findFirst({
          where: { studentId: currentStudentId, batchId: test.batchId, status: "ACTIVE" },
          select: { id: true },
        })
      : null;
    if (!enrollment) {
      notFound();
    }
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
        submittedAt: att.submittedAt ? new Date(att.submittedAt).toISOString() : null,
        tabSwitchCount: att.tabSwitchCount ?? 0,
      };
    }
  }

  // Rank leaderboard across all attempts
  const rankedLeaderboard = rankLeaderboardAttempts(
    test.attempts.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      student: {
        name: a.student?.name || "Student",
        admissionNo: a.student?.admissionNo || "EF-0000",
      },
      score: a.score ?? 0,
      scoreMinor: a.scoreMinor ?? 0,
      startedAt: a.startedAt ? new Date(a.startedAt) : new Date(),
      submittedAt: a.submittedAt ? new Date(a.submittedAt) : null,
      status: a.status,
      tabSwitchCount: a.tabSwitchCount ?? 0,
    })),
    test.totalMarks
  );

  return (
    <div className="py-8 px-4 sm:px-6">
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
