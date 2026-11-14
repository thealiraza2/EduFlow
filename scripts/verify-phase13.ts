import { db } from "../src/lib/db";
import {
  calculateDropoutRiskScore,
  formatRiskFallbackExplanation,
  computeWeakSubjectAnalysis,
  getAcademyStudentsRiskOverview,
  CURRICULUM_TOPICS,
} from "../src/lib/risk";
import {
  generateQuestions,
  explainRisk,
  parseAndValidateQuestionsJson,
} from "../src/lib/ai";
import { TestStatus, QuestionType } from "@prisma/client";

async function main() {
  console.log("\n=======================================================");
  console.log("   ACADEMYHUB - PHASE 13 VERIFICATION SUITE           ");
  console.log("   AI Analytics + AI Test Paper Generator (Invariant 12)");
  console.log("=======================================================\n");

  // Step 1: Load default test academy
  const academy = await db.academy.findFirst({
    where: { slug: "main" },
  });

  if (!academy) {
    throw new Error("Default seed academy not found. Run seed script first.");
  }
  console.log(`[1] Active Tenant Academy: "${academy.name}" (ID: ${academy.id})`);

  // Step 2: Verify Deterministic Dropout Risk Model (Invariant 12)
  console.log("\n[2] Testing Deterministic Dropout Risk Calculation (Pure Code)...");
  const riskOverview = await getAcademyStudentsRiskOverview(academy.id);
  console.log(`    Total Active Students Evaluated: ${riskOverview.length}`);

  for (const st of riskOverview.slice(0, 5)) {
    console.log(
      `    -> [${st.riskLevel}] ${st.studentName} (${st.admissionNo}) | Score: ${st.riskScore} | Att: ${st.attendancePct}% | Overdue: ${st.overdueMonths} mo | Trend: ${st.marksTrend}`
    );
    console.log(`       Explanation: "${st.explanation}"`);
    if (st.weakSubject) {
      console.log(
        `       Weak Subject: ${st.weakSubject.subject} (${st.weakSubject.averagePercentage}% avg) -> Focus: ${st.weakSubject.suggestedTopics.join(", ")}`
      );
    }
  }

  // Assert risk overview is strictly sorted (HIGH first, then MEDIUM, then LOW)
  const weightMap: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  for (let i = 0; i < riskOverview.length - 1; i++) {
    const cur = weightMap[riskOverview[i].riskLevel];
    const next = weightMap[riskOverview[i + 1].riskLevel];
    if (cur < next) {
      throw new Error(`Risk list not properly sorted at index ${i}: ${riskOverview[i].riskLevel} followed by ${riskOverview[i + 1].riskLevel}`);
    }
  }
  console.log("    ✓ Dropout risk list verified strictly sorted (HIGH -> MEDIUM -> LOW).");

  // Step 3: Test Weak Subject and Non-Hallucinated Topics Mapping
  console.log("\n[3] Testing Weak-Subject Analysis & Curriculum Non-Hallucination...");
  const mockResults = [
    { subject: "Chemistry", obtainedMarks: 82, totalMarks: 100 },
    { subject: "Mathematics", obtainedMarks: 35, totalMarks: 100 },
    { subject: "Physics", obtainedMarks: 70, totalMarks: 100 },
  ];
  const weak = computeWeakSubjectAnalysis(mockResults, "Tariq");
  if (weak.weakestSubject !== "Mathematics") {
    throw new Error(`Expected Mathematics as weakest, got ${weak.weakestSubject}`);
  }
  if (!CURRICULUM_TOPICS["Mathematics"].includes(weak.suggestedTopics[0])) {
    throw new Error("Suggested topic is not in the verified curriculum list!");
  }
  console.log(`    ✓ Weakest Subject correctly detected: ${weak.weakestSubject} (${weak.averagePercentage}%)`);
  console.log(`    ✓ Curriculum topics verified from syllabus map: ${weak.suggestedTopics.join(", ")}`);

  // Step 4: Test Graceful Degradation & Fallback (Without API Key)
  console.log("\n[4] Testing AI Fallback & Resilience (Invariant: never crash without API key)...");
  const originalKey = process.env.LLM_API_KEY;
  process.env.LLM_API_KEY = ""; // Simulate unconfigured API key

  const fallbackExp = await explainRisk({
    studentName: "Saad",
    attendancePct: 50,
    overdueMonths: 2,
    marksTrend: "DROPPING",
    riskLevel: "HIGH",
  });
  console.log(`    Fallback Explanation Output: "${fallbackExp}"`);
  if (!fallbackExp.includes("(AI unavailable — showing data only)")) {
    throw new Error("Expected fallback message tag not found in explanation!");
  }
  console.log("    ✓ explainRisk degraded gracefully with fallback badge.");

  // Test generateQuestions with empty API key
  const fallbackPaper = await generateQuestions({
    subject: "Physics",
    topics: ["Newton's Laws of Motion", "Work, Power & Energy"],
    totalMarks: 20,
    difficulty: "MEDIUM",
    mcqCount: 3,
    shortCount: 1,
  });
  if (!fallbackPaper.success || !fallbackPaper.isFallback || fallbackPaper.questions.length !== 4) {
    throw new Error("generateQuestions fallback failed to return structured template questions.");
  }
  console.log(`    ✓ generateQuestions generated ${fallbackPaper.questions.length} structured syllabus questions via fallback.`);

  // Step 5: Test Saving Generated Test Paper to Database as DRAFT
  console.log("\n[5] Testing Saving Generated Test Paper to Database...");
  const batch = await db.batch.findFirst({
    where: { academyId: academy.id },
  });
  if (!batch) {
    throw new Error("No batch found in seed academy.");
  }

  const newTestTitle = `AI Physics Assessment Draft - ${Date.now()}`;
  const savedTest = await db.test.create({
    data: {
      academyId: academy.id,
      batchId: batch.id,
      subject: "Physics",
      title: newTestTitle,
      totalMarks: 20,
      date: new Date(),
      status: TestStatus.DRAFT,
      durationMinutes: 30,
      negativeMarking: 0.25,
      questions: {
        create: fallbackPaper.questions.map((q, idx) => ({
          academyId: academy.id,
          type: q.type === "SHORT" ? QuestionType.SHORT : QuestionType.MCQ,
          text: q.text,
          options: q.options && q.options.length > 0 ? (q.options as any) : undefined,
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          order: idx + 1,
        })),
      },
    },
    include: {
      questions: true,
    },
  });

  console.log(`    Created Test ID: ${savedTest.id} | Status: ${savedTest.status} | Questions: ${savedTest.questions.length}`);
  if (savedTest.status !== "DRAFT" || savedTest.questions.length !== 4) {
    throw new Error("Saved test does not match expected draft specifications.");
  }

  // Verify it appears in teacher tests query
  const testInDb = await db.test.findUnique({
    where: { id: savedTest.id },
    include: { questions: { orderBy: { order: "asc" } }, batch: true },
  });
  if (!testInDb || testInDb.status !== "DRAFT") {
    throw new Error("Failed to query created test from database.");
  }
  console.log(`    ✓ Test "${testInDb.title}" successfully verified in DB with status DRAFT.`);

  // Clean up created test
  await db.test.delete({
    where: { id: savedTest.id },
  });
  console.log("    ✓ Test record cleanly pruned after verification.");

  // Restore env var
  if (originalKey) {
    process.env.LLM_API_KEY = originalKey;
  }

  console.log("\n=======================================================");
  console.log("   PHASE 13 VERIFICATION PASSED SUCCESSFULLY!         ");
  console.log("=======================================================\n");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
