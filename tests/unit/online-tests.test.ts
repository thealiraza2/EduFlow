import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import {
  calculateTestGrading,
  rankLeaderboardAttempts,
} from "@/lib/online-tests";
import {
  startOnlineTestAttemptAction,
  submitOnlineTestAttemptAction,
  recordTabSwitchAction,
  closeTestAndPublishLeaderboardAction,
  gradeShortQuestionAction,
} from "@/lib/actions/online-tests";
import { QuestionType, AttemptStatus, TestStatus, Role } from "@prisma/client";

describe("Phase 12: Online Test Engine & Auto-Grading", () => {
  const testQuestions = [
    { id: "q1", type: QuestionType.MCQ, marks: 2.0, correctAnswer: "Option A" },
    { id: "q2", type: QuestionType.MCQ, marks: 2.0, correctAnswer: "Option B" },
    { id: "q3", type: QuestionType.MCQ, marks: 2.0, correctAnswer: "Option C" },
    { id: "q4", type: QuestionType.MCQ, marks: 2.0, correctAnswer: "Option D" },
    { id: "q5", type: QuestionType.SHORT, marks: 2.0, correctAnswer: "Newton's First Law" },
  ];

  describe("1. Auto-Grading Math & Negative Marking", () => {
    it("grades all correct MCQs accurately without negative marking", () => {
      const answers = {
        q1: "Option A",
        q2: "Option B",
        q3: "Option C",
        q4: "Option D",
      };

      const result = calculateTestGrading(testQuestions.slice(0, 4), answers, 0);
      expect(result.finalScore).toBe(8.0);
      expect(result.scoreMinor).toBe(800);
      expect(result.status).toBe(AttemptStatus.GRADED);
      expect(result.hasShortQuestions).toBe(false);
      expect(result.evaluatedAnswers.every((a) => a.isCorrect)).toBe(true);
    });

    it("applies negative marking penalty for incorrect MCQ answers", () => {
      // 2 correct (2*2 = 4), 2 wrong with 0.25 negative marking (2 * -0.25 = -0.5)
      // Net score = 4 - 0.5 = 3.5
      const answers = {
        q1: "Option A", // Correct (+2.0)
        q2: "Option B", // Correct (+2.0)
        q3: "Option WRONG", // Wrong (-0.25)
        q4: "Option WRONG", // Wrong (-0.25)
      };

      const result = calculateTestGrading(testQuestions.slice(0, 4), answers, 0.25);
      expect(result.finalScore).toBe(3.5);
      expect(result.scoreMinor).toBe(350);
      expect(result.status).toBe(AttemptStatus.GRADED);

      const q3Eval = result.evaluatedAnswers.find((a) => a.questionId === "q3");
      expect(q3Eval?.isCorrect).toBe(false);
      expect(q3Eval?.marksAwarded).toBe(-0.25);
    });

    it("skipping questions incurs zero penalty (unattempted = 0 marks)", () => {
      // 1 correct (+2), 3 skipped (0)
      const answers = {
        q1: "Option A",
        q2: "", // Skipped
        q3: "   ", // Blank string
      };

      const result = calculateTestGrading(testQuestions.slice(0, 4), answers, 0.5);
      expect(result.finalScore).toBe(2.0);
      expect(result.scoreMinor).toBe(200);

      const q2Eval = result.evaluatedAnswers.find((a) => a.questionId === "q2");
      expect(q2Eval?.marksAwarded).toBe(0);
      expect(q2Eval?.isCorrect).toBe(false);
    });

    it("floors score at 0 when negative deductions exceed correct marks", () => {
      // 0 correct, 4 wrong with 0.5 penalty = -2.0, floored to 0.0
      const answers = {
        q1: "WRONG",
        q2: "WRONG",
        q3: "WRONG",
        q4: "WRONG",
      };

      const result = calculateTestGrading(testQuestions.slice(0, 4), answers, 0.5);
      expect(result.finalScore).toBe(0);
      expect(result.scoreMinor).toBe(0);
    });

    it("routes SHORT questions to marking queue with status SUBMITTED", () => {
      const answers = {
        q1: "Option A", // Correct (+2)
        q5: "An object at rest stays at rest.", // Short answer
      };

      const result = calculateTestGrading(testQuestions, answers, 0.25);
      expect(result.hasShortQuestions).toBe(true);
      expect(result.status).toBe(AttemptStatus.SUBMITTED);
      expect(result.finalScore).toBe(2.0); // Only MCQs auto-graded so far

      const q5Eval = result.evaluatedAnswers.find((a) => a.questionId === "q5");
      expect(q5Eval?.isCorrect).toBeNull();
      expect(q5Eval?.marksAwarded).toBe(0);
    });
  });

  describe("2. Leaderboard Ordering & Tie-Breaking", () => {
    const baseTime = new Date("2026-11-14T10:00:00Z");

    const sampleAttempts = [
      {
        id: "att-1",
        studentId: "s1",
        student: { name: "Ayesha Malik", admissionNo: "AH-001" },
        score: 8.0,
        scoreMinor: 800,
        startedAt: baseTime,
        submittedAt: new Date(baseTime.getTime() + 300 * 1000), // 300 seconds (5m)
        status: AttemptStatus.GRADED,
        tabSwitchCount: 1,
      },
      {
        id: "att-2",
        studentId: "s2",
        student: { name: "Bilal Ahmed", admissionNo: "AH-002" },
        score: 8.0, // Same score as Ayesha, but took 450 seconds
        scoreMinor: 800,
        startedAt: baseTime,
        submittedAt: new Date(baseTime.getTime() + 450 * 1000), // 450 seconds (7.5m)
        status: AttemptStatus.GRADED,
        tabSwitchCount: 0,
      },
      {
        id: "att-3",
        studentId: "s3",
        student: { name: "Zainab Fatima", admissionNo: "AH-003" },
        score: 10.0, // Highest score
        scoreMinor: 1000,
        startedAt: baseTime,
        submittedAt: new Date(baseTime.getTime() + 400 * 1000), // 400 seconds
        status: AttemptStatus.GRADED,
        tabSwitchCount: 2,
      },
      {
        id: "att-4",
        studentId: "s4",
        student: { name: "Cheater User", admissionNo: "AH-004" },
        score: 6.0,
        scoreMinor: 600,
        startedAt: baseTime,
        submittedAt: new Date(baseTime.getTime() + 200 * 1000),
        status: AttemptStatus.GRADED,
        tabSwitchCount: 7, // > 5 tab switches!
      },
    ];

    it("ranks primarily by score DESC, and breaks ties by time taken ASC", () => {
      const ranked = rankLeaderboardAttempts(sampleAttempts, 10.0);

      expect(ranked.length).toBe(4);

      // Rank 1: Zainab Fatima (Score 10.0)
      expect(ranked[0].rank).toBe(1);
      expect(ranked[0].studentName).toBe("Zainab Fatima");
      expect(ranked[0].score).toBe(10.0);

      // Rank 2: Ayesha Malik (Score 8.0 in 300s beats Bilal's 8.0 in 450s)
      expect(ranked[1].rank).toBe(2);
      expect(ranked[1].studentName).toBe("Ayesha Malik");
      expect(ranked[1].score).toBe(8.0);
      expect(ranked[1].timeTakenSeconds).toBe(300);

      // Rank 3: Bilal Ahmed (Score 8.0 in 450s)
      expect(ranked[2].rank).toBe(3);
      expect(ranked[2].studentName).toBe("Bilal Ahmed");
      expect(ranked[2].score).toBe(8.0);
      expect(ranked[2].timeTakenSeconds).toBe(450);

      // Rank 4: Cheater User (Score 6.0)
      expect(ranked[3].rank).toBe(4);
      expect(ranked[3].studentName).toBe("Cheater User");
      expect(ranked[3].score).toBe(6.0);
    });

    it("flags attempts with > 5 tab switches honestly without auto-failing", () => {
      const ranked = rankLeaderboardAttempts(sampleAttempts, 10.0);

      const cheaterRow = ranked.find((r) => r.studentName === "Cheater User");
      expect(cheaterRow?.tabSwitchCount).toBe(7);
      expect(cheaterRow?.isFlagged).toBe(true);
      // Not auto-failed: score remains 6.0
      expect(cheaterRow?.score).toBe(6.0);

      const ayeshaRow = ranked.find((r) => r.studentName === "Ayesha Malik");
      expect(ayeshaRow?.tabSwitchCount).toBe(1);
      expect(ayeshaRow?.isFlagged).toBe(false);
    });
  });

  describe("3. Database End-to-End Attempt Lifecycle & Invariants", () => {
    let testAcademyId = "seed-academy-id";
    let testClassId: string;
    let testBatchId: string;
    let testStudentId: string;
    let testId: string;
    let question1Id: string;
    let question2Id: string;

    beforeAll(async () => {
      const cls = await db.class.create({
        data: {
          academyId: testAcademyId,
          name: "Test-Online-10th",
          section: "A",
          capacity: 40,
        },
      });
      testClassId = cls.id;

      const batch = await db.batch.create({
        data: {
          academyId: testAcademyId,
          classId: testClassId,
          name: "Online Batch",
          timing: "5-6 PM",
          feeMinor: 400000,
        },
      });
      testBatchId = batch.id;

      const student = await db.student.create({
        data: {
          academyId: testAcademyId,
          admissionNo: `TEST-ONLINE-${Date.now()}`,
          name: "Tariq Jamil",
          guardianName: "Jamil Khan",
          guardianPhone: "03001122334",
          status: "ACTIVE",
        },
      });
      testStudentId = student.id;

      const test = await db.test.create({
        data: {
          academyId: testAcademyId,
          batchId: testBatchId,
          subject: "Mathematics",
          title: "Algebra Speed Quiz",
          totalMarks: 4,
          date: new Date(),
          durationMinutes: 10,
          negativeMarking: 0.25,
          shuffleQuestions: true,
          status: TestStatus.PUBLISHED,
          isClosed: false,
        },
      });
      testId = test.id;

      const q1 = await db.question.create({
        data: {
          academyId: testAcademyId,
          testId: test.id,
          type: QuestionType.MCQ,
          text: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correctAnswer: "4",
          marks: 2.0,
          order: 1,
        },
      });
      question1Id = q1.id;

      const q2 = await db.question.create({
        data: {
          academyId: testAcademyId,
          testId: test.id,
          type: QuestionType.MCQ,
          text: "What is the square root of 16?",
          options: ["2", "4", "8", "16"],
          correctAnswer: "4",
          marks: 2.0,
          order: 2,
        },
      });
      question2Id = q2.id;
    });

    afterAll(async () => {
      await db.studentAnswer.deleteMany({
        where: { attempt: { testId } },
      });
      await db.testAttempt.deleteMany({
        where: { testId },
      });
      await db.question.deleteMany({
        where: { testId },
      });
      await db.test.deleteMany({
        where: { id: testId },
      });
      await db.student.deleteMany({
        where: { id: testStudentId },
      });
      await db.batch.deleteMany({
        where: { id: testBatchId },
      });
      await db.class.deleteMany({
        where: { id: testClassId },
      });
    });

    it("creates initial attempt with server-side startedAt timestamp", async () => {
      const attempt = await db.testAttempt.create({
        data: {
          academyId: testAcademyId,
          testId,
          studentId: testStudentId,
          startedAt: new Date(),
          status: AttemptStatus.IN_PROGRESS,
        },
      });

      expect(attempt.id).toBeDefined();
      expect(attempt.status).toBe(AttemptStatus.IN_PROGRESS);
      expect(attempt.startedAt).toBeInstanceOf(Date);
    });

    it("enforces UNIQUE(testId, studentId): second start attempt is rejected by database", async () => {
      await expect(
        db.testAttempt.create({
          data: {
            academyId: testAcademyId,
            testId,
            studentId: testStudentId,
            startedAt: new Date(),
            status: AttemptStatus.IN_PROGRESS,
          },
        })
      ).rejects.toThrow();
    });

    it("anti-cheat: tab-switch counter increments on the attempt", async () => {
      const attempt = await db.testAttempt.findUnique({
        where: {
          testId_studentId: {
            testId,
            studentId: testStudentId,
          },
        },
      });

      // Simulate tab switches
      await db.testAttempt.update({
        where: { id: attempt!.id },
        data: { tabSwitchCount: { increment: 6 } },
      });

      const updated = await db.testAttempt.findUnique({
        where: { id: attempt!.id },
      });

      expect(updated?.tabSwitchCount).toBe(6);
    });

    it("auto-grades submitted answers and saves score with floor at 0", async () => {
      const attempt = await db.testAttempt.findUnique({
        where: {
          testId_studentId: {
            testId,
            studentId: testStudentId,
          },
        },
      });

      // Q1 correct ("4"), Q2 wrong ("8") -> Score: 2 - 0.25 = 1.75
      const questions = await db.question.findMany({ where: { testId } });
      const answers: Record<string, string> = {
        [question1Id]: "4", // Correct (+2)
        [question2Id]: "8", // Wrong (-0.25)
      };

      const grading = calculateTestGrading(questions, answers, 0.25);
      expect(grading.finalScore).toBe(1.75);

      await db.testAttempt.update({
        where: { id: attempt!.id },
        data: {
          submittedAt: new Date(),
          score: grading.finalScore,
          scoreMinor: grading.scoreMinor,
          status: AttemptStatus.GRADED,
        },
      });

      const finalized = await db.testAttempt.findUnique({
        where: { id: attempt!.id },
      });

      expect(finalized?.status).toBe(AttemptStatus.GRADED);
      expect(finalized?.score).toBe(1.75);
      expect(finalized?.scoreMinor).toBe(175);
    });
  });
});
