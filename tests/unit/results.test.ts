import { describe, it, expect } from "vitest";
import {
  calculateGrade,
  calculatePercentage,
  calculatePositions,
  formatOrdinalPosition,
  calculateBatchAnalytics,
} from "@/lib/results";

describe("Phase 6: Result Calculation & Analytics Engine (src/lib/results.ts)", () => {
  it("enforces strict grade boundaries (89.9 -> A, 90 -> A+)", () => {
    // A+ >= 90
    expect(calculateGrade(90.0)).toBe("A+");
    expect(calculateGrade(95.5)).toBe("A+");
    expect(calculateGrade(100.0)).toBe("A+");

    // A: 80 - 89.9
    expect(calculateGrade(89.9)).toBe("A");
    expect(calculateGrade(85.0)).toBe("A");
    expect(calculateGrade(80.0)).toBe("A");

    // B: 70 - 79.9
    expect(calculateGrade(79.9)).toBe("B");
    expect(calculateGrade(75.0)).toBe("B");
    expect(calculateGrade(70.0)).toBe("B");

    // C: 60 - 69.9
    expect(calculateGrade(69.9)).toBe("C");
    expect(calculateGrade(65.0)).toBe("C");
    expect(calculateGrade(60.0)).toBe("C");

    // D: 50 - 59.9
    expect(calculateGrade(59.9)).toBe("D");
    expect(calculateGrade(55.0)).toBe("D");
    expect(calculateGrade(50.0)).toBe("D");

    // F: < 50
    expect(calculateGrade(49.9)).toBe("F");
    expect(calculateGrade(35.0)).toBe("F");
    expect(calculateGrade(0.0)).toBe("F");
  });

  it("calculates accurate percentages with 1 decimal precision", () => {
    expect(calculatePercentage(85, 100)).toBe(85.0);
    expect(calculatePercentage(67.5, 75)).toBe(90.0);
    expect(calculatePercentage(45, 50)).toBe(90.0);
    expect(calculatePercentage(23, 75)).toBe(30.7);
  });

  it("calculates class positions where ties share position", () => {
    const scores = [
      { id: "s1", obtainedMarks: 95, student: { name: "Ali", admissionNo: "001" } },
      { id: "s2", obtainedMarks: 95, student: { name: "Bilal", admissionNo: "002" } },
      { id: "s3", obtainedMarks: 80, student: { name: "Hamza", admissionNo: "003" } },
      { id: "s4", obtainedMarks: 75, student: { name: "Danish", admissionNo: "004" } },
      { id: "s5", obtainedMarks: 75, student: { name: "Ehsan", admissionNo: "005" } },
      { id: "s6", obtainedMarks: 60, student: { name: "Fahad", admissionNo: "006" } },
    ];

    const ranked = calculatePositions(scores, 100);

    // Ali & Bilal tie for 1st
    expect(ranked[0].position).toBe(1);
    expect(ranked[0].positionFormatted).toBe("1st");
    expect(ranked[0].item.obtainedMarks).toBe(95);

    expect(ranked[1].position).toBe(1); // Shared 1st position!
    expect(ranked[1].positionFormatted).toBe("1st");
    expect(ranked[1].item.obtainedMarks).toBe(95);

    // Hamza takes 3rd
    expect(ranked[2].position).toBe(3);
    expect(ranked[2].positionFormatted).toBe("3rd");
    expect(ranked[2].item.obtainedMarks).toBe(80);

    // Danish & Ehsan tie for 4th
    expect(ranked[3].position).toBe(4);
    expect(ranked[3].positionFormatted).toBe("4th");

    expect(ranked[4].position).toBe(4); // Shared 4th position!
    expect(ranked[4].positionFormatted).toBe("4th");

    // Fahad takes 6th
    expect(ranked[5].position).toBe(6);
    expect(ranked[5].positionFormatted).toBe("6th");
    expect(ranked[5].item.obtainedMarks).toBe(60);
  });

  it("formats ordinal positions correctly", () => {
    expect(formatOrdinalPosition(1)).toBe("1st");
    expect(formatOrdinalPosition(2)).toBe("2nd");
    expect(formatOrdinalPosition(3)).toBe("3rd");
    expect(formatOrdinalPosition(4)).toBe("4th");
    expect(formatOrdinalPosition(11)).toBe("11th");
    expect(formatOrdinalPosition(12)).toBe("12th");
    expect(formatOrdinalPosition(13)).toBe("13th");
    expect(formatOrdinalPosition(21)).toBe("21st");
    expect(formatOrdinalPosition(22)).toBe("22nd");
    expect(formatOrdinalPosition(23)).toBe("23rd");
  });

  it("computes batch analytics (averages, toppers, and distribution)", () => {
    const testData = {
      totalMarks: 100,
      results: [
        { id: "1", obtainedMarks: 95, student: { name: "Hamza", admissionNo: "AH-001" } },
        { id: "2", obtainedMarks: 85, student: { name: "Ayesha", admissionNo: "AH-002" } },
        { id: "3", obtainedMarks: 75, student: { name: "Usman", admissionNo: "AH-003" } },
        { id: "4", obtainedMarks: 65, student: { name: "Fatima", admissionNo: "AH-004" } },
      ],
    };

    const analytics = calculateBatchAnalytics(testData);

    expect(analytics.totalStudents).toBe(4);
    // (95 + 85 + 75 + 65) / 4 = 320 / 4 = 80
    expect(analytics.classAverageMarks).toBe(80);
    expect(analytics.classAveragePercentage).toBe(80);
    expect(analytics.highestMarks).toBe(95);
    expect(analytics.lowestMarks).toBe(65);

    // Toppers check
    expect(analytics.toppers.length).toBe(3);
    expect(analytics.toppers[0].name).toBe("Hamza");
    expect(analytics.toppers[0].grade).toBe("A+");
    expect(analytics.toppers[0].positionFormatted).toBe("1st");
  });
});
