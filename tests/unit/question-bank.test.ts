import { describe, it, expect } from "vitest";
import { csvTemplate, parseCsv, parseQuestionCsv } from "@/lib/bank/csv";
import { buildSections, paperMarks, pickSpread, sectionHeading } from "@/lib/bank/paper";

const seeded = (s = 1) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

describe("question bank CSV", () => {
  it("parses quoted fields with commas, quotes and newlines", () => {
    const rows = parseCsv('a,b,c\r\n"x, y","he said ""hi""","line1\nline2"\r\n');
    expect(rows).toEqual([["a", "b", "c"], ["x, y", 'he said "hi"', "line1\nline2"]]);
  });

  it("round-trips the template, including Urdu and the BOM", () => {
    const { rows, errors } = parseQuestionCsv(csvTemplate());
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ unitNumber: 1, type: "MCQ", source: "EXERCISE", answer: "0", marks: 1, topicCode: "1.1" });
    expect(rows[0].options?.[0]).toEqual({ en: "metre", ur: "میٹر" });
    expect(rows[1]).toMatchObject({ type: "SHORT", source: "PAST_PAPER", marks: 2, pastPaperRef: "BISE Lahore 2024" });
    expect(rows[1].textUr).toContain("ورنیئر");
  });

  it("reports every bad row with its line number and imports nothing", () => {
    const csv = [
      "unit,type,question_en,a_en,b_en,c_en,d_en,answer",
      "1,MCQ,Q1,a,b,c,d,E",
      "x,SHORT,Q2,,,,,",
      "2,ESSAY,Q3,,,,,",
      "2,MCQ,Q4,a,,c,d,A",
      "3,LONG,,,,,,",
      "3,LONG,Fine long question,,,,,",
    ].join("\n");
    const { rows, errors } = parseQuestionCsv(csv);
    expect(errors.map((e) => e.line)).toEqual([2, 3, 4, 5, 6]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ type: "LONG", marks: 5 });
  });

  it("rejects files without the required columns", () => {
    expect(parseQuestionCsv("type,question_en\nMCQ,x").errors[0].message).toContain('"unit"');
    expect(parseQuestionCsv("unit,type\n1,MCQ").errors[0].message).toContain("question_en");
  });
});

describe("paper builder", () => {
  const pool = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: `m${i}`, type: "MCQ" as const, unitId: i < 5 ? "u1" : "u2" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `s${i}`, type: "SHORT" as const, unitId: i < 2 ? "u1" : "u2" })),
  ];

  it("spreads picks across units and never repeats a question", () => {
    const ids = pickSpread(pool.filter((q) => q.type === "MCQ"), 4, new Set(), seeded(3));
    expect(new Set(ids).size).toBe(4);
    expect(ids.filter((id) => Number(id.slice(1)) < 5)).toHaveLength(2);
  });

  it("builds sections, reports shortfalls and caps attempt at what was found", () => {
    const { sections, shortfalls } = buildSections(
      [{ type: "MCQ", total: 6, required: 6, marksEach: 1 }, { type: "SHORT", total: 6, required: 5, marksEach: 2 }],
      pool, seeded(7),
    );
    expect(sections[0].questionIds).toHaveLength(6);
    expect(sections[1].questionIds).toHaveLength(4);
    expect(sections[1].required).toBe(4);
    expect(shortfalls).toEqual([{ type: "SHORT", wanted: 6, found: 4 }]);
    expect(paperMarks(sections)).toBe(6 + 8);
  });

  it("writes the marks formula for choice sections", () => {
    const h = sectionHeading({ type: "SHORT", required: 5, marksEach: 2, questionIds: ["a", "b", "c", "d", "e", "f", "g", "h"] });
    expect(h.en).toBe("Answer any 5 of the following 8 questions briefly. (5 × 2 = 10)");
    expect(h.ur).toContain("کوئی سے 5");
  });
});
