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

  // Resolve current student ID
  let currentStudentId: string | null = null;

  if (session.user.role === Role.STUDENT) {
    let student = await db.student.findFirst({
      where: { userId: session.user.id },
    });
    if (!student && session.user.email) {
      student = await db.student.findFirst({
        where: {
          OR: [
            { admissionNo: session.user.name || "" },
            { guardianPhone: session.user.phone || "" },
          ],
        },
      });
      if (student) {
        await db.student.update({
          where: { id: student.id },
          data: { userId: session.user.id },
        });
      }
    }
    if (!student) {
      student = await db.student.findFirst({
        where: session.user.academyId ? { academyId: session.user.academyId } : {},
      });
    }
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
