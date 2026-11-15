/**
 * EduFlow - Result Calculation & Analytics Engine
 * Single source of truth for grades, percentages, class positions (with ties),
 * and batch analytics.
 */

export type Grade = "A+" | "A" | "B" | "C" | "D" | "F";

/**
 * Calculates letter grade based on percentage:
 * A+ ≥ 90
 * A  ≥ 80 (and < 90)
 * B  ≥ 70 (and < 80)
 * C  ≥ 60 (and < 70)
 * D  ≥ 50 (and < 60)
 * F  < 50
 *
 * e.g. 89.9% -> A, 90.0% -> A+
 */
export function calculateGrade(percentage: number): Grade {
  if (percentage >= 90) return "A+";
  if (percentage >= 80) return "A";
  if (percentage >= 70) return "B";
  if (percentage >= 60) return "C";
  if (percentage >= 50) return "D";
  return "F";
}

/**
 * Calculates percentage rounded to 1 decimal place.
 */
export function calculatePercentage(obtainedMarks: number, totalMarks: number): number {
  if (totalMarks <= 0) return 0;
  const pct = (obtainedMarks / totalMarks) * 100;
  return Math.round(pct * 10) / 10;
}

/**
 * Formats position with English ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
 */
export function formatOrdinalPosition(pos: number): string {
  const j = pos % 10;
  const k = pos % 100;
  if (j === 1 && k !== 11) return `${pos}st`;
  if (j === 2 && k !== 12) return `${pos}nd`;
  if (j === 3 && k !== 13) return `${pos}rd`;
  return `${pos}th`;
}

export interface StudentScoreItem {
  id: string;
  obtainedMarks: number;
  [key: string]: any;
}

export interface RankedScoreItem<T extends StudentScoreItem> {
  item: T;
  position: number;
  positionFormatted: string;
  percentage: number;
  grade: Grade;
}

/**
 * Assigns class positions where ties share position (Standard competition ranking: 1, 1, 3).
 */
export function calculatePositions<T extends StudentScoreItem>(
  items: T[],
  totalMarks: number
): RankedScoreItem<T>[] {
  // Sort descending by obtainedMarks
  const sorted = [...items].sort((a, b) => b.obtainedMarks - a.obtainedMarks);

  let currentRank = 1;
  const ranked: RankedScoreItem<T>[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // If not first and obtained marks equal previous, share rank
    if (i > 0 && current.obtainedMarks === sorted[i - 1].obtainedMarks) {
      // position remains the same as previous
    } else {
      currentRank = i + 1;
    }

    const pct = calculatePercentage(current.obtainedMarks, totalMarks);
    const grade = calculateGrade(pct);

    ranked.push({
      item: current,
      position: currentRank,
      positionFormatted: formatOrdinalPosition(currentRank),
      percentage: pct,
      grade,
    });
  }

  return ranked;
}

export interface BatchAnalytics {
  totalStudents: number;
  classAveragePercentage: number;
  classAverageMarks: number;
  highestMarks: number;
  lowestMarks: number;
  toppers: Array<{
    name: string;
    admissionNo: string;
    obtainedMarks: number;
    percentage: number;
    grade: Grade;
    positionFormatted: string;
  }>;
  gradeDistribution: Record<Grade, number>;
}

/**
 * Computes batch analytics for a test: average %, toppers, and grade distribution.
 */
export function calculateBatchAnalytics(
  test: {
    totalMarks: number;
    results: Array<{
      id: string;
      obtainedMarks: number;
      student: { name: string; admissionNo: string };
      remarks?: string | null;
    }>;
  }
): BatchAnalytics {
  const totalStudents = test.results.length;
  if (totalStudents === 0) {
    return {
      totalStudents: 0,
      classAveragePercentage: 0,
      classAverageMarks: 0,
      highestMarks: 0,
      lowestMarks: 0,
      toppers: [],
      gradeDistribution: { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
    };
  }

  const items = test.results.map((r) => ({
    id: r.id,
    obtainedMarks: r.obtainedMarks,
    student: r.student,
  }));

  const ranked = calculatePositions(items, test.totalMarks);

  const totalObtained = items.reduce((sum, item) => sum + item.obtainedMarks, 0);
  const avgMarks = Math.round((totalObtained / totalStudents) * 10) / 10;
  const avgPct = calculatePercentage(avgMarks, test.totalMarks);

  const highestMarks = ranked[0]?.item.obtainedMarks ?? 0;
  const lowestMarks = ranked[ranked.length - 1]?.item.obtainedMarks ?? 0;

  const distribution: Record<Grade, number> = { "A+": 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
  ranked.forEach((r) => {
    distribution[r.grade]++;
  });

  // Toppers: top 3 positions
  const toppers = ranked
    .filter((r) => r.position <= 3)
    .map((r) => ({
      name: r.item.student.name,
      admissionNo: r.item.student.admissionNo,
      obtainedMarks: r.item.obtainedMarks,
      percentage: r.percentage,
      grade: r.grade,
      positionFormatted: r.positionFormatted,
    }));

  return {
    totalStudents,
    classAveragePercentage: avgPct,
    classAverageMarks: avgMarks,
    highestMarks,
    lowestMarks,
    toppers,
    gradeDistribution: distribution,
  };
}
