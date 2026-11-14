/**
 * AcademyHub - Deterministic Student Risk & Weak Subject Analysis (Phase 13)
 *
 * INVARIANT 12: Deterministic code does all the deciding; the LLM only does the wording.
 * - Risk score is mathematically computed from real database facts (attendance, fee dues, marks trend).
 * - Thresholds for LOW, MEDIUM, and HIGH are hardcoded and strictly tested.
 * - Topics are selected from verified curriculum lists, NEVER hallucinated by AI.
 */

import { db } from "@/lib/db";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type MarksTrend = "DROPPING" | "STABLE" | "RISING" | "INSUFFICIENT_DATA";

export interface StudentRiskMetrics {
  studentId: string;
  studentName: string;
  admissionNo: string;
  batchName?: string;
  guardianPhone?: string;
  attendancePct: number;
  overdueMonths: number;
  marksTrend: MarksTrend;
  riskScore: number;
  riskLevel: RiskLevel;
  explanation: string;
  weakSubject?: {
    subject: string;
    averagePercentage: number;
    suggestedTopics: string[];
  } | null;
}

export interface WeakSubjectAnalysis {
  weakestSubject: string | null;
  averagePercentage: number;
  suggestedTopics: string[];
  fallbackExplanation: string;
  subjectAverages: Array<{ subject: string; averagePercentage: number; totalTests: number }>;
}

export const CURRICULUM_TOPICS: Record<string, string[]> = {
  Mathematics: [
    "Quadratic Equations",
    "Matrices & Determinants",
    "Trigonometry & Identities",
    "Coordinate Geometry",
    "Polynomials & Factoring",
  ],
  Physics: [
    "Kinematics & Vectors",
    "Newton's Laws of Motion",
    "Work, Power & Energy",
    "Electric Current & Circuits",
    "Electromagnetic Induction",
  ],
  Chemistry: [
    "Chemical Bonding & Structure",
    "Stoichiometry & Mole Concept",
    "Periodic Table Trends",
    "Acids, Bases & Salts",
    "Organic Chemistry Fundamentals",
  ],
  Biology: [
    "Cell Biology & Division",
    "Genetics & Mendel's Laws",
    "Enzymes & Bioenergetics",
    "Human Circulatory System",
    "Ecology & Environment",
  ],
  English: [
    "Tenses & Subject-Verb Agreement",
    "Direct & Indirect Speech",
    "Active & Passive Voice",
    "Essay & Formal Letter Writing",
    "Reading Comprehension",
  ],
};

/**
 * Pure deterministic formula for student dropout risk.
 *
 * Penalties:
 * 1. Attendance (Last 30 Days):
 *    - < 60%: 40 points
 *    - 60% to 74%: 20 points
 *    - >= 75%: 0 points
 *
 * 2. Fee Overdue Months:
 *    - >= 2 overdue months: 40 points
 *    - 1 overdue month: 20 points
 *    - 0 overdue: 0 points
 *
 * 3. Marks Trend:
 *    - DROPPING: 20 points
 *    - STABLE / RISING / INSUFFICIENT_DATA: 0 points
 *
 * Thresholds:
 * - HIGH: score >= 50
 * - MEDIUM: score >= 25 and < 50
 * - LOW: score < 25
 */
export function calculateDropoutRiskScore(
  attendancePct: number,
  overdueMonths: number,
  marksTrend: MarksTrend = "STABLE"
): { riskScore: number; riskLevel: RiskLevel } {
  let score = 0;

  // 1. Attendance Penalty
  if (attendancePct < 60) {
    score += 40;
  } else if (attendancePct < 75) {
    score += 20;
  }

  // 2. Overdue Fee Penalty
  if (overdueMonths >= 2) {
    score += 40;
  } else if (overdueMonths === 1) {
    score += 20;
  }

  // 3. Marks Trend Penalty
  if (marksTrend === "DROPPING") {
    score += 20;
  }

  // Determine categorical level
  let riskLevel: RiskLevel = "LOW";
  if (score >= 50) {
    riskLevel = "HIGH";
  } else if (score >= 25) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return { riskScore: score, riskLevel };
}

/**
 * Generates the deterministic fallback sentence for dropout risk.
 * Used whenever LLM is unavailable or when strict invariant reproduction is required.
 */
export function formatRiskFallbackExplanation(
  studentName: string,
  attendancePct: number,
  overdueMonths: number,
  riskLevel: RiskLevel,
  marksTrend?: MarksTrend
): string {
  const trendNote = marksTrend === "DROPPING" ? " aur test marks mein kami dekhi gayi hai" : "";
  if (overdueMonths === 0) {
    return `${studentName} ki attendance ${attendancePct}% hai${trendNote} — dropout risk ${riskLevel}.`;
  }
  return `${studentName} ki attendance ${attendancePct}% hai aur ${overdueMonths} mahine ki fee due hai${trendNote} — dropout risk ${riskLevel}.`;
}

/**
 * Analyzes student test results to detect weakest subject and return verified curriculum topics.
 */
export function computeWeakSubjectAnalysis(
  results: Array<{
    subject: string;
    obtainedMarks: number;
    totalMarks: number;
  }>,
  studentName: string = "Student"
): WeakSubjectAnalysis {
  if (results.length === 0) {
    return {
      weakestSubject: null,
      averagePercentage: 0,
      suggestedTopics: [],
      fallbackExplanation: `${studentName} has no recorded test results yet.`,
      subjectAverages: [],
    };
  }

  const subjectMap: Record<string, { totalObtained: number; totalMax: number; count: number }> = {};

  for (const r of results) {
    if (!subjectMap[r.subject]) {
      subjectMap[r.subject] = { totalObtained: 0, totalMax: 0, count: 0 };
    }
    subjectMap[r.subject].totalObtained += r.obtainedMarks;
    subjectMap[r.subject].totalMax += r.totalMarks;
    subjectMap[r.subject].count += 1;
  }

  const averages = Object.entries(subjectMap).map(([subject, data]) => {
    const avg = data.totalMax > 0 ? Math.round((data.totalObtained / data.totalMax) * 1000) / 10 : 0;
    return {
      subject,
      averagePercentage: avg,
      totalTests: data.count,
    };
  });

  // Sort ascending: lowest average first
  averages.sort((a, b) => a.averagePercentage - b.averagePercentage);

  const weakest = averages[0];
  const subjectName = weakest.subject;

  // Retrieve standard non-hallucinated topics
  const topicsPool =
    CURRICULUM_TOPICS[subjectName] || [
      `${subjectName} Core Fundamentals`,
      `${subjectName} Conceptual Problem Solving`,
      `${subjectName} Revision & Practice`,
    ];

  const suggestedTopics = topicsPool.slice(0, 3);
  const fallbackExplanation = `${studentName} is weakest in ${subjectName} (${weakest.averagePercentage}% average). Recommended focus areas: ${suggestedTopics.join(", ")}.`;

  return {
    weakestSubject: subjectName,
    averagePercentage: weakest.averagePercentage,
    suggestedTopics,
    fallbackExplanation,
    subjectAverages: averages,
  };
}

/**
 * Computes live dropout risk metrics for active students in an academy.
 * Optional batchIds filter for teacher view.
 */
export async function getAcademyStudentsRiskOverview(
  academyId: string,
  batchIds?: string[]
): Promise<StudentRiskMetrics[]> {
  const whereClause: any = { academyId, status: "ACTIVE" };
  if (batchIds && batchIds.length > 0) {
    whereClause.enrollments = {
      some: {
        batchId: { in: batchIds },
        status: "ACTIVE",
      },
    };
  }

  const students = await db.student.findMany({
    where: whereClause,
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: true,
          attendance: {
            where: {
              date: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
              },
            },
          },
        },
      },
      invoices: {
        where: {
          status: { in: ["UNPAID", "PARTIAL"] },
        },
      },
      testResults: {
        include: { test: true },
        orderBy: { test: { date: "asc" } },
      },
    },
  });

  const list: StudentRiskMetrics[] = [];

  for (const s of students) {
    // 1. Attendance %
    const allAtt = s.enrollments.flatMap((e) => e.attendance);
    const presentCount = allAtt.filter((a) => a.status === "PRESENT" || a.status === "LATE").length;
    const attPct = allAtt.length > 0 ? Math.round((presentCount / allAtt.length) * 100) : 100;

    // 2. Overdue Months
    const overdueMonths = s.invoices.length;

    // 3. Marks Trend
    let trend: MarksTrend = "STABLE";
    const res = s.testResults;
    if (res.length >= 4) {
      const recent = res.slice(-3);
      const earlier = res.slice(0, -3);

      const recentAvg =
        recent.reduce((sum, r) => sum + (r.obtainedMarks / r.test.totalMarks) * 100, 0) / recent.length;
      const earlierAvg =
        earlier.reduce((sum, r) => sum + (r.obtainedMarks / r.test.totalMarks) * 100, 0) / earlier.length;

      if (recentAvg < earlierAvg - 10) {
        trend = "DROPPING";
      } else if (recentAvg > earlierAvg + 10) {
        trend = "RISING";
      }
    }

    const { riskScore, riskLevel } = calculateDropoutRiskScore(attPct, overdueMonths, trend);
    const baseExplanation = formatRiskFallbackExplanation(s.name, attPct, overdueMonths, riskLevel, trend);
    const explanation = process.env.LLM_API_KEY?.trim()
      ? baseExplanation
      : `${baseExplanation} (AI unavailable — showing data only)`;

    // 4. Weak Subject Detection (deterministic)
    const testItems = s.testResults.map((tr) => ({
      subject: tr.test.subject,
      obtainedMarks: tr.obtainedMarks,
      totalMarks: tr.test.totalMarks,
    }));
    const weakAnalysis = computeWeakSubjectAnalysis(testItems, s.name);

    const primaryBatch = s.enrollments[0]?.batch?.name || "Unassigned Batch";

    list.push({
      studentId: s.id,
      studentName: s.name,
      admissionNo: s.admissionNo,
      batchName: primaryBatch,
      guardianPhone: s.guardianPhone,
      attendancePct: attPct,
      overdueMonths,
      marksTrend: trend,
      riskScore,
      riskLevel,
      explanation,
      weakSubject: weakAnalysis.weakestSubject
        ? {
            subject: weakAnalysis.weakestSubject,
            averagePercentage: weakAnalysis.averagePercentage,
            suggestedTopics: weakAnalysis.suggestedTopics,
          }
        : null,
    });
  }

  // Sort: HIGH risk first, then MEDIUM, then LOW
  const priorityWeight: Record<RiskLevel, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  list.sort((a, b) => {
    if (priorityWeight[b.riskLevel] !== priorityWeight[a.riskLevel]) {
      return priorityWeight[b.riskLevel] - priorityWeight[a.riskLevel];
    }
    return b.riskScore - a.riskScore;
  });

  return list;
}
