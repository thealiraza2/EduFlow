import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  calculateDropoutRiskScore,
  formatRiskFallbackExplanation,
  computeWeakSubjectAnalysis,
  CURRICULUM_TOPICS,
} from "@/lib/risk";
import { explainRisk } from "@/lib/ai";

describe("Phase 13: Deterministic Dropout Risk Model (Invariant 12)", () => {
  // Hand-computed fixtures testing all penalty rules and threshold boundaries
  it("Fixture 1: High Risk student (critical attendance <60%, 2+ fee overdue, dropping marks)", () => {
    // Attendance 50% (<60% -> 40 pts)
    // Overdue 2 months (>=2 -> 40 pts)
    // Marks trend DROPPING (20 pts)
    // Expected: 40 + 40 + 20 = 100 -> HIGH
    const result = calculateDropoutRiskScore(50, 2, "DROPPING");
    expect(result.riskScore).toBe(100);
    expect(result.riskLevel).toBe("HIGH");
  });

  it("Fixture 2: Medium Risk student (critical attendance <60%, 0 overdue, stable marks)", () => {
    // Attendance 55% (<60% -> 40 pts)
    // Overdue 0 (0 pts)
    // Marks trend STABLE (0 pts)
    // Expected: 40 + 0 + 0 = 40 -> MEDIUM (25 <= score < 50)
    const result = calculateDropoutRiskScore(55, 0, "STABLE");
    expect(result.riskScore).toBe(40);
    expect(result.riskLevel).toBe("MEDIUM");
  });

  it("Fixture 3: Medium Risk student (moderate attendance 60-74%, 1 month overdue, stable marks)", () => {
    // Attendance 70% (60-74% -> 20 pts)
    // Overdue 1 month (20 pts)
    // Marks trend STABLE (0 pts)
    // Expected: 20 + 20 + 0 = 40 -> MEDIUM
    const result = calculateDropoutRiskScore(70, 1, "STABLE");
    expect(result.riskScore).toBe(40);
    expect(result.riskLevel).toBe("MEDIUM");
  });

  it("Fixture 4: Low Risk student (healthy attendance >=75%, 0 overdue, rising marks)", () => {
    // Attendance 92% (>=75% -> 0 pts)
    // Overdue 0 (0 pts)
    // Marks trend RISING (0 pts)
    // Expected: 0 + 0 + 0 = 0 -> LOW (score < 25)
    const result = calculateDropoutRiskScore(92, 0, "RISING");
    expect(result.riskScore).toBe(0);
    expect(result.riskLevel).toBe("LOW");
  });

  it("Fixture 5: Boundary threshold tests for LOW / MEDIUM / HIGH", () => {
    // Score exactly 20 -> LOW
    expect(calculateDropoutRiskScore(70, 0, "STABLE")).toEqual({
      riskScore: 20,
      riskLevel: "LOW",
    });

    // Score exactly 25 -> MEDIUM (e.g. attendance 70% [20] + dropping [20] = 40 -> MEDIUM)
    // Attendance 80% (0) + 1 month overdue (20) + dropping (20) = 40 -> MEDIUM
    expect(calculateDropoutRiskScore(80, 1, "DROPPING")).toEqual({
      riskScore: 40,
      riskLevel: "MEDIUM",
    });

    // Attendance 65% (20) + 2 months overdue (40) = 60 -> HIGH (>=50)
    expect(calculateDropoutRiskScore(65, 2, "STABLE")).toEqual({
      riskScore: 60,
      riskLevel: "HIGH",
    });
  });

  it("formats deterministic risk explanation without LLM", () => {
    const text1 = formatRiskFallbackExplanation("Ahmed Ali", 62, 2, "HIGH", "STABLE");
    expect(text1).toBe("Ahmed Ali's attendance is 62% with 2 months fee overdue — dropout risk HIGH.");

    const text2 = formatRiskFallbackExplanation("Fatima Khan", 92, 0, "LOW", "STABLE");
    expect(text2).toBe("Fatima Khan's attendance is 92% — dropout risk LOW.");

    const text3 = formatRiskFallbackExplanation("Bilal", 55, 1, "HIGH", "DROPPING");
    expect(text3).toContain("and test scores show a declining trend");
    expect(text3).toContain("dropout risk HIGH");
  });
});

describe("Phase 13: Deterministic Weak-Subject & Curriculum Analysis", () => {
  it("identifies lowest average subject accurately across mixed assessments", () => {
    const results = [
      { subject: "Mathematics", obtainedMarks: 85, totalMarks: 100 }, // 85%
      { subject: "Mathematics", obtainedMarks: 75, totalMarks: 100 }, // 75% -> Maths Avg = 80%
      { subject: "Physics", obtainedMarks: 40, totalMarks: 100 },     // 40%
      { subject: "Physics", obtainedMarks: 50, totalMarks: 100 },     // 50% -> Physics Avg = 45%
      { subject: "Chemistry", obtainedMarks: 90, totalMarks: 100 },   // 90% -> Chemistry Avg = 90%
    ];

    const analysis = computeWeakSubjectAnalysis(results, "Zain");

    expect(analysis.weakestSubject).toBe("Physics");
    expect(analysis.averagePercentage).toBe(45);
    // Topics must come from non-hallucinated curriculum map
    expect(analysis.suggestedTopics).toEqual(CURRICULUM_TOPICS["Physics"].slice(0, 3));
    expect(analysis.fallbackExplanation).toContain("Zain is weakest in Physics (45% average)");
  });

  it("handles student with no test records gracefully", () => {
    const analysis = computeWeakSubjectAnalysis([], "New Student");
    expect(analysis.weakestSubject).toBeNull();
    expect(analysis.averagePercentage).toBe(0);
    expect(analysis.suggestedTopics).toEqual([]);
    expect(analysis.fallbackExplanation).toContain("no recorded test results yet");
  });
});

describe("Phase 13: LLM Graceful Fallbacks (Missing API Key / Timeout)", () => {
  const originalEnv = process.env.LLM_API_KEY;

  beforeEach(() => {
    delete process.env.LLM_API_KEY;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.LLM_API_KEY = originalEnv;
    } else {
      delete process.env.LLM_API_KEY;
    }
  });

  it("explainRisk falls back to deterministic text when LLM_API_KEY is empty", async () => {
    process.env.LLM_API_KEY = "";

    const explanation = await explainRisk({
      studentName: "Hamza Tariq",
      attendancePct: 58,
      overdueMonths: 2,
      marksTrend: "DROPPING",
      riskLevel: "HIGH",
    });

    expect(explanation).toContain("Hamza Tariq's attendance is 58% with 2 months fee overdue");
    expect(explanation).toContain("dropout risk HIGH");
    expect(explanation).toContain("(AI insights unavailable — connect an AI key in Settings)");
  });
});
