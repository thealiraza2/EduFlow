"use server";

import { z } from "zod";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role, AttemptStatus } from "@prisma/client";
import { calculateTestGrading, rankLeaderboardAttempts } from "@/lib/online-tests";
import { revalidatePath } from "next/cache";

const startAttemptSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  studentId: z.string().optional(),
});

/**
 * Starts or resumes an online test attempt.
 *
 * Invariants:
 * 1. Timer is strictly server-side (never trust browser clock).
 * 2. Exactly one attempt per student per test (second start attempt is blocked).
 * 3. Question correct answers are NEVER transmitted to the client during an active test.
 */
export async function startOnlineTestAttemptAction(input: z.infer<typeof startAttemptSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in to take the test.");
  }

  const { testId, studentId: requestedStudentId } = startAttemptSchema.parse(input);

  // 1. Resolve student ID
  let studentId = requestedStudentId;

  if (session.user.role === Role.STUDENT) {
    const student = await db.student.findFirst({
      where: { userId: session.user.id },
    });
    if (!student) {
      throw new Error("Student record not linked to your user account.");
    }
    studentId = student.id;
  } else if (session.user.role === Role.PARENT) {
    if (!studentId) {
      // Find first child linked to parent
      const firstChild = await db.student.findFirst({
        where: { guardianUserId: session.user.id },
      });
      if (!firstChild) {
        throw new Error("No linked student found for this parent account.");
      }
      studentId = firstChild.id;
    } else {
      // Verify parent owns this child
      const child = await db.student.findFirst({
        where: { id: studentId, guardianUserId: session.user.id },
      });
      if (!child) {
        throw new Error("Access Denied: You cannot take tests on behalf of other parents' children.");
      }
    }
  } else if (!studentId) {
    // Admin or Teacher testing flow
    const firstStudent = await db.student.findFirst();
    if (!firstStudent) throw new Error("No students exist in database.");
    studentId = firstStudent.id;
  }

  // 2. Fetch test with questions
  const test = await db.test.findUnique({
    where: { id: testId },
    include: {
      questions: {
        orderBy: { order: "asc" },
      },
      batch: true,
    },
  });

  if (!test) {
    throw new Error("Test not found.");
  }

  if (test.status !== "PUBLISHED") {
    throw new Error("This test is not published yet.");
  }

  const durationMinutes = test.durationMinutes || 30;
  const durationMs = durationMinutes * 60 * 1000;
  const now = new Date();

  // 3. Check for existing attempt
  let attempt = await db.testAttempt.findUnique({
    where: {
      testId_studentId: {
        testId: test.id,
        studentId: studentId!,
      },
    },
    include: {
      answers: true,
    },
  });

  if (attempt) {
    // If already submitted or graded, block re-attempt
    if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.GRADED) {
      return {
        alreadyCompleted: true,
        attemptId: attempt.id,
        status: attempt.status,
        score: attempt.score,
        totalMarks: test.totalMarks,
        message: "You have already completed this test. Second attempts are blocked.",
      };
    }

    // Check if server-side timer has expired during an existing in-progress attempt
    const elapsedMs = now.getTime() - attempt.startedAt.getTime();
    if (elapsedMs >= durationMs + 5000) {
      // Auto-submit expired attempt
      const answersMap: Record<string, string> = {};
      attempt.answers.forEach((ans) => {
        answersMap[ans.questionId] = ans.answer;
      });

      const autoGrade = calculateTestGrading(test.questions, answersMap, test.negativeMarking);

      const finalized = await db.testAttempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: now,
          score: autoGrade.finalScore,
          scoreMinor: autoGrade.scoreMinor,
          status: autoGrade.status,
        },
      });

      return {
        alreadyCompleted: true,
        attemptId: finalized.id,
        status: finalized.status,
        score: finalized.score,
        totalMarks: test.totalMarks,
        message: "Test time expired. Your answers were automatically submitted.",
      };
    }
  } else {
    // Create new attempt with server-side timestamp
    attempt = await db.testAttempt.create({
      data: {
        academyId: test.academyId,
        testId: test.id,
        studentId: studentId!,
        startedAt: now,
        status: AttemptStatus.IN_PROGRESS,
      },
      include: {
        answers: true,
      },
    });
  }

  // Calculate remaining seconds server-side
  const elapsedMs = now.getTime() - attempt.startedAt.getTime();
  const remainingSeconds = Math.max(0, Math.floor((durationMs - elapsedMs) / 1000));

  // Prepare sanitized questions (STRIP CORRECT ANSWERS for security!)
  let clientQuestions = test.questions.map((q) => ({
    id: q.id,
    type: q.type,
    text: q.text,
    options: q.options as string[] | null,
    marks: q.marks,
    order: q.order,
  }));

  // Shuffle questions if enabled (deterministic pseudo-random based on attemptId)
  if (test.shuffleQuestions) {
    clientQuestions = [...clientQuestions].sort((a, b) => {
      const hashA = (a.id + attempt.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const hashB = (b.id + attempt.id).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
      return hashA - hashB;
    });
  }

  return {
    alreadyCompleted: false,
    attemptId: attempt.id,
    testId: test.id,
    testTitle: test.title,
    subject: test.subject,
    durationMinutes,
    remainingSeconds,
    negativeMarking: test.negativeMarking,
    questions: clientQuestions,
    existingAnswers: attempt.answers.reduce(
      (acc, a) => ({ ...acc, [a.questionId]: a.answer }),
      {} as Record<string, string>
    ),
    startedAt: attempt.startedAt.toISOString(),
  };
}

const submitAttemptSchema = z.object({
  attemptId: z.string().min(1, "Attempt ID is required"),
  answers: z.record(z.string()),
  tabSwitchCount: z.number().int().nonnegative().optional(),
});

/**
 * Submits and auto-grades an online test attempt.
 */
export async function submitOnlineTestAttemptAction(input: z.infer<typeof submitAttemptSchema>) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized: Please log in.");
  }

  const { attemptId, answers, tabSwitchCount } = submitAttemptSchema.parse(input);

  const attempt = await db.testAttempt.findUnique({
    where: { id: attemptId },
    include: {
      test: {
        include: {
          questions: true,
        },
      },
      student: true,
    },
  });

  if (!attempt) {
    throw new Error("Test attempt not found.");
  }

  if (attempt.status === AttemptStatus.SUBMITTED || attempt.status === AttemptStatus.GRADED) {
    return {
      success: true,
      alreadySubmitted: true,
      score: attempt.score,
      totalMarks: attempt.test.totalMarks,
      status: attempt.status,
    };
  }

  const test = attempt.test;
  const now = new Date();

  // Grade the attempt
  const grading = calculateTestGrading(test.questions, answers, test.negativeMarking);

  // Atomically save answers and update attempt status
  await db.$transaction(async (tx) => {
    // 1. Upsert student answers
    for (const evaluated of grading.evaluatedAnswers) {
      await tx.studentAnswer.upsert({
        where: {
          attemptId_questionId: {
            attemptId: attempt.id,
            questionId: evaluated.questionId,
          },
        },
        update: {
          answer: evaluated.answer,
          isCorrect: evaluated.isCorrect,
          marksAwarded: evaluated.marksAwarded,
        },
        create: {
          academyId: test.academyId,
          attemptId: attempt.id,
          questionId: evaluated.questionId,
          answer: evaluated.answer,
          isCorrect: evaluated.isCorrect,
          marksAwarded: evaluated.marksAwarded,
        },
      });
    }

    // 2. Finalize attempt record
    await tx.testAttempt.update({
      where: { id: attempt.id },
      data: {
        submittedAt: now,
        score: grading.finalScore,
        scoreMinor: grading.scoreMinor,
        status: grading.status,
        tabSwitchCount: Math.max(attempt.tabSwitchCount, tabSwitchCount || 0),
      },
    });

    // 3. If fully graded (no short questions), record in TestResult
    if (grading.status === AttemptStatus.GRADED) {
      await tx.testResult.upsert({
        where: {
          testId_studentId: {
            testId: test.id,
            studentId: attempt.studentId,
          },
        },
        update: {
          obtainedMarks: grading.finalScore,
          remarks: `Online MCQ Assessment. Score: ${grading.finalScore}/${test.totalMarks}`,
        },
        create: {
          academyId: test.academyId,
          testId: test.id,
          studentId: attempt.studentId,
          obtainedMarks: grading.finalScore,
          remarks: `Online MCQ Assessment. Score: ${grading.finalScore}/${test.totalMarks}`,
        },
      });
    }
  });

  revalidatePath(`/student/test/${test.id}`);
  revalidatePath("/teacher/marking");
  revalidatePath(`/teacher/tests`);

  return {
    success: true,
    alreadySubmitted: false,
    score: grading.finalScore,
    totalMarks: test.totalMarks,
    status: grading.status,
    hasShortQuestions: grading.hasShortQuestions,
    tabSwitchCount: Math.max(attempt.tabSwitchCount, tabSwitchCount || 0),
    isFlagged: (tabSwitchCount || 0) > 5,
  };
}

/**
 * Records tab blur / switch event for anti-cheat audit.
 */
export async function recordTabSwitchAction(attemptId: string) {
  try {
    const updated = await db.testAttempt.update({
      where: { id: attemptId },
      data: {
        tabSwitchCount: { increment: 1 },
      },
      select: {
        tabSwitchCount: true,
      },
    });

    return {
      success: true,
      tabSwitchCount: updated.tabSwitchCount,
      isFlagged: updated.tabSwitchCount > 5,
    };
  } catch (error: any) {
    console.error("Failed to record tab switch:", error);
    return { success: false };
  }
}

/**
 * Closes the test and officially publishes the leaderboard.
 */
export async function closeTestAndPublishLeaderboardAction(testId: string) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    throw new Error("Unauthorized: Only teachers or administrators can close tests.");
  }

  const updated = await db.test.update({
    where: { id: testId },
    data: {
      isClosed: true,
      closedAt: new Date(),
    },
  });

  revalidatePath(`/student/test/${testId}`);
  revalidatePath(`/teacher/tests`);

  return {
    success: true,
    isClosed: updated.isClosed,
    closedAt: updated.closedAt?.toISOString(),
  };
}

/**
 * Teacher grading of a subjective SHORT question.
 */
export async function gradeShortQuestionAction(input: {
  answerId: string;
  marksAwarded: number;
}) {
  const session = await auth();
  if (!session?.user || (session.user.role !== Role.TEACHER && session.user.role !== Role.ADMIN && session.user.role !== Role.SUPER_ADMIN)) {
    throw new Error("Unauthorized: Faculty role required for grading.");
  }

  const answer = await db.studentAnswer.findUnique({
    where: { id: input.answerId },
    include: {
      question: true,
      attempt: {
        include: {
          test: true,
          answers: true,
        },
      },
    },
  });

  if (!answer) {
    throw new Error("Answer not found.");
  }

  const maxMarks = answer.question.marks;
  const marks = Math.max(0, Math.min(input.marksAwarded, maxMarks));

  await db.$transaction(async (tx) => {
    // 1. Update this answer
    await tx.studentAnswer.update({
      where: { id: answer.id },
      data: {
        marksAwarded: marks,
        isCorrect: marks > 0,
      },
    });

    // 2. Fetch all answers for this attempt to recalculate total
    const allAnswers = await tx.studentAnswer.findMany({
      where: { attemptId: answer.attemptId },
      include: { question: true },
    });

    let newTotal = 0;
    let anyUngradedShort = false;

    for (const a of allAnswers) {
      if (a.question.type === "SHORT" && a.isCorrect === null) {
        anyUngradedShort = true;
      }
      newTotal += a.marksAwarded;
    }

    const finalScore = Math.max(0, Math.round(newTotal * 100) / 100);
    const newStatus = anyUngradedShort ? AttemptStatus.SUBMITTED : AttemptStatus.GRADED;

    await tx.testAttempt.update({
      where: { id: answer.attemptId },
      data: {
        score: finalScore,
        scoreMinor: Math.round(finalScore * 100),
        status: newStatus,
      },
    });

    if (newStatus === AttemptStatus.GRADED) {
      await tx.testResult.upsert({
        where: {
          testId_studentId: {
            testId: answer.attempt.testId,
            studentId: answer.attempt.studentId,
          },
        },
        update: {
          obtainedMarks: finalScore,
          remarks: `Online Assessment Evaluated. Score: ${finalScore}/${answer.attempt.test.totalMarks}`,
        },
        create: {
          academyId: answer.attempt.academyId,
          testId: answer.attempt.testId,
          studentId: answer.attempt.studentId,
          obtainedMarks: finalScore,
          remarks: `Online Assessment Evaluated. Score: ${finalScore}/${answer.attempt.test.totalMarks}`,
        },
      });
    }
  });

  revalidatePath("/teacher/marking");
  return { success: true };
}
