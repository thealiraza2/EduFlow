/**
 * EduFlow - AI LLM Provider Interface & Test Paper Generator (Phase 13)
 *
 * INVARIANT 12: Deterministic code does the deciding; LLM only does the wording.
 * - Credentials from environment ONLY (LLM_API_KEY, LLM_MODEL, LLM_ENDPOINT).
 * - Every call is bound by a strict 15-second AbortSignal timeout.
 * - If the LLM fails or is unconfigured, features fall back to deterministic templates:
 *   "AI unavailable — showing data only" (nothing ever crashes).
 * - Question generation output is strictly parsed and verified via Zod schema.
 */

import { z } from "zod";
import { formatRiskFallbackExplanation, RiskLevel, MarksTrend } from "@/lib/risk";

export const questionDraftSchema = z.object({
  type: z.enum(["MCQ", "SHORT", "LONG"]),
  text: z.string().min(5, "Question text must be at least 5 characters"),
  options: z.array(z.string()).min(2, "MCQs must have at least 2 options").max(6).optional().nullable(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  marks: z.number().positive("Marks must be positive"),
  section: z.string().optional(),
});

export type QuestionDraft = z.infer<typeof questionDraftSchema>;
export const testPaperDraftSchema = z.array(questionDraftSchema).min(1, "Paper must have at least 1 question");

export interface RiskExplanationInput {
  studentName: string;
  attendancePct: number;
  overdueMonths: number;
  marksTrend: MarksTrend;
  riskLevel: RiskLevel;
}

export interface SchemeStructure {
  mcq?: { count: number; marksEach: number };
  short?: { count: number; marksEach: number; attempt?: number };
  long?: { count: number; marksEach: number; attempt?: number };
}

export interface GenerateBoardPaperInput {
  boardName: string;
  className: string;
  subject: string;
  chapters: Array<{ number: number; title: string }>;
  scheme: {
    id: string;
    structure: SchemeStructure;
    totalMarks: number;
    timeMinutes?: number | null;
    verified: boolean;
  };
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface GenerateQuestionsInput {
  subject: string;
  topics: string[];
  totalMarks: number;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  mcqCount?: number;
  shortCount?: number;
}

export interface LLMConfig {
  apiKey: string;
  model: string;
  endpoint: string;
  timeoutMs: number;
}

export function getLLMConfig(): LLMConfig {
  return {
    apiKey: process.env.LLM_API_KEY?.trim() || "",
    model: process.env.LLM_MODEL?.trim() || "llama-3.1-70b-versatile",
    endpoint: process.env.LLM_ENDPOINT?.trim() || "https://api.groq.com/openai/v1/chat/completions",
    timeoutMs: 15000, // Strict 15-second timeout
  };
}

/**
 * Raw OpenAI-compatible API caller with 15s timeout
 */
async function callLLM(prompt: string, systemPrompt?: string): Promise<string> {
  const config = getLLMConfig();

  if (!config.apiKey) {
    throw new Error("AI unavailable: LLM_API_KEY is not configured.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    messages.push({ role: "user", content: prompt });

    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages,
        temperature: 0.2, // Low temperature for deterministic formatting
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`LLM upstream error ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response received from LLM.");
    }

    return content.trim();
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === "AbortError" || error.message?.includes("aborted")) {
      throw new Error("LLM request timed out after 15 seconds.");
    }
    throw error;
  }
}

/**
 * Generates natural language risk explanation using LLM with deterministic fallback.
 * The score and level NEVER come from the LLM.
 */
export async function explainRisk(input: RiskExplanationInput): Promise<string> {
  const fallback = formatRiskFallbackExplanation(
    input.studentName,
    input.attendancePct,
    input.overdueMonths,
    input.riskLevel,
    input.marksTrend
  );

  const config = getLLMConfig();
  if (!config.apiKey) {
    return `${fallback} (AI unavailable — showing data only)`;
  }

  const prompt = `Write ONE concise, plain-language sentence in Urdu-English mix explaining this student's dropout risk.
Facts:
- Student: ${input.studentName}
- Attendance (last 30 days): ${input.attendancePct}%
- Fee overdue months: ${input.overdueMonths}
- Marks trend: ${input.marksTrend}
- Dropout Risk Level (computed by system): ${input.riskLevel}

Example output format: "${input.studentName} ki attendance ${input.attendancePct}% hai aur ${input.overdueMonths} mahine ki fee due hai — dropout risk ${input.riskLevel}."
Return ONLY the one sentence, without quotes or additional commentary.`;

  try {
    const response = await callLLM(prompt, "You are an assistant for Pakistani tuition academy administrators.");
    return response.replace(/^["']|["']$/g, "").trim() || fallback;
  } catch (err: any) {
    console.warn("[AI RISK EXPLANATION FALLBACK]", err.message);
    return `${fallback} (AI unavailable — showing data only)`;
  }
}

/**
 * Generates test questions using LLM with strict Zod validation and one-retry resilience.
 */
export async function generateQuestions(input: GenerateQuestionsInput): Promise<{
  success: boolean;
  questions: QuestionDraft[];
  isFallback: boolean;
  error?: string;
}> {
  const mcqCount = input.mcqCount ?? 4;
  const shortCount = input.shortCount ?? 1;
  const totalQuestions = mcqCount + shortCount;
  const marksPerQuestion = Math.max(1, Math.round((input.totalMarks / totalQuestions) * 10) / 10);

  // High quality deterministic fallback template in case LLM is unavailable
  const fallbackDrafts: QuestionDraft[] = [];

  for (let i = 1; i <= mcqCount; i++) {
    const topic = input.topics[(i - 1) % input.topics.length] || `${input.subject} Concepts`;
    fallbackDrafts.push({
      type: "MCQ",
      text: `Identify the fundamental principle regarding ${topic} in ${input.subject}:`,
      options: [
        `Primary standard principle of ${topic}`,
        `Secondary theoretical factor of ${topic}`,
        `Hypothetical assumption of ${topic}`,
        `Inverse property of ${topic}`,
      ],
      correctAnswer: `Primary standard principle of ${topic}`,
      marks: marksPerQuestion,
    });
  }

  for (let i = 1; i <= shortCount; i++) {
    const topic = input.topics[i % input.topics.length] || `${input.subject} Application`;
    fallbackDrafts.push({
      type: "SHORT",
      text: `Explain in 2-3 sentences the practical application of ${topic} in modern ${input.subject}.`,
      options: null,
      correctAnswer: `Detailed explanation covering key concepts of ${topic}.`,
      marks: marksPerQuestion,
    });
  }

  const config = getLLMConfig();
  if (!config.apiKey) {
    return {
      success: true,
      questions: fallbackDrafts,
      isFallback: true,
    };
  }

  const systemPrompt = `You are an expert Pakistani curriculum exam paper setter.
You generate test papers as a JSON array of questions matching the exact schema:
[
  {
    "type": "MCQ",
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": ${marksPerQuestion}
  },
  {
    "type": "SHORT",
    "text": "Short answer question prompt?",
    "options": null,
    "correctAnswer": "Key points expected in student answer.",
    "marks": ${marksPerQuestion}
  }
]
Output ONLY valid, parseable JSON. Do not include markdown codeblocks, explanation, or preamble.`;

  const userPrompt = `Generate a ${input.difficulty} test paper for:
Subject: ${input.subject}
Topics: ${input.topics.join(", ")}
Target Total Marks: ${input.totalMarks}
Questions Required: exactly ${mcqCount} MCQs and ${shortCount} SHORT question(s).
Output the JSON array now.`;

  // Attempt 1: Call LLM
  try {
    const rawContent = await callLLM(userPrompt, systemPrompt);
    const parsed = parseAndValidateQuestionsJson(rawContent);
    return {
      success: true,
      questions: parsed,
      isFallback: false,
    };
  } catch (firstErr: any) {
    console.warn("[AI PAPER GENERATION RETRY]", firstErr.message);

    // Attempt 2: One retry with corrective instruction
    try {
      const correctivePrompt = `${userPrompt}\n\nIMPORTANT: Your previous output failed JSON validation. Ensure valid JSON array with type, text, options, correctAnswer, and marks.`;
      const retryContent = await callLLM(correctivePrompt, systemPrompt);
      const parsed = parseAndValidateQuestionsJson(retryContent);
      return {
        success: true,
        questions: parsed,
        isFallback: false,
      };
    } catch (retryErr: any) {
      console.warn("[AI PAPER GENERATION FAILED - RETURNING FALLBACK]", retryErr.message);
      // Graceful fallback: return deterministic template with message
      return {
        success: true,
        questions: fallbackDrafts,
        isFallback: true,
        error: "AI unavailable or invalid response — generated structured template from syllabus.",
      };
    }
  }
}

/**
 * Extracts and validates questions JSON against Zod schema
 */
export function parseAndValidateQuestionsJson(raw: string): QuestionDraft[] {
  // Strip markdown ```json ... ``` code blocks if present
  let clean = raw.trim();
  clean = clean.replace(/^```json\s*/i, "");
  clean = clean.replace(/^```\s*/i, "");
  clean = clean.replace(/\s*```$/i, "");

  // Locate the first '[' and last ']'
  const startIdx = clean.indexOf("[");
  const endIdx = clean.lastIndexOf("]");

  if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
    throw new Error("No JSON array found in LLM output.");
  }

  const jsonStr = clean.slice(startIdx, endIdx + 1);
  const parsed = JSON.parse(jsonStr);

  return testPaperDraftSchema.parse(parsed);
}

/**
 * Validates that question counts and marks strictly match stored PaperScheme
 */
export function validatePaperAgainstScheme(
  questions: QuestionDraft[],
  schemeStructure: SchemeStructure,
  totalMarks: number
): { valid: boolean; error?: string } {
  const mcqs = questions.filter((q) => q.type === "MCQ");
  const shorts = questions.filter((q) => q.type === "SHORT");
  const longs = questions.filter((q) => q.type === "LONG");

  const expectedMCQ = schemeStructure.mcq?.count ?? 0;
  const expectedShort = schemeStructure.short?.count ?? 0;
  const expectedLong = schemeStructure.long?.count ?? 0;

  if (mcqs.length !== expectedMCQ) {
    return {
      valid: false,
      error: `MCQ count mismatch: expected ${expectedMCQ}, got ${mcqs.length}.`,
    };
  }

  if (shorts.length !== expectedShort) {
    return {
      valid: false,
      error: `Short questions count mismatch: expected ${expectedShort}, got ${shorts.length}.`,
    };
  }

  if (longs.length !== expectedLong) {
    return {
      valid: false,
      error: `Long questions count mismatch: expected ${expectedLong}, got ${longs.length}.`,
    };
  }

  // Calculate paper marks according to scheme
  const mcqMarks = mcqs.reduce((s, q) => s + q.marks, 0);
  const shortAttempt = schemeStructure.short?.attempt ?? shorts.length;
  const shortMarksEach = schemeStructure.short?.marksEach ?? 2;
  const shortMarks = shortAttempt * shortMarksEach;

  const longAttempt = schemeStructure.long?.attempt ?? longs.length;
  const longMarksEach = schemeStructure.long?.marksEach ?? 5;
  const longMarks = longAttempt * longMarksEach;

  const paperAttemptTotal = mcqMarks + shortMarks + longMarks;
  const allQuestionsTotal = questions.reduce((s, q) => s + q.marks, 0);

  if (paperAttemptTotal !== totalMarks && allQuestionsTotal !== totalMarks) {
    return {
      valid: false,
      error: `Total marks mismatch: expected ${totalMarks} marks, got ${paperAttemptTotal} (attempted) / ${allQuestionsTotal} (sum).`,
    };
  }

  return { valid: true };
}

/**
 * Builds structured deterministic fallback questions conforming to exact board scheme
 */
export function buildDeterministicSchemeQuestions(
  subject: string,
  chapters: Array<{ number: number; title: string }>,
  schemeStructure: SchemeStructure
): QuestionDraft[] {
  const drafts: QuestionDraft[] = [];
  const chapterTitles =
    chapters.length > 0
      ? chapters.map((c) => `Ch ${c.number}: ${c.title}`)
      : [`${subject} Core Principles`];

  // 1. MCQs
  const mcqCount = schemeStructure.mcq?.count ?? 0;
  const mcqMarks = schemeStructure.mcq?.marksEach ?? 1;
  for (let i = 1; i <= mcqCount; i++) {
    const ch = chapterTitles[(i - 1) % chapterTitles.length];
    drafts.push({
      type: "MCQ",
      text: `Identify the fundamental scientific law governing ${ch} in ${subject}:`,
      options: [
        `Primary standard principle of ${ch}`,
        `Secondary theoretical factor of ${ch}`,
        `Inverse relation in ${ch}`,
        `Hypothetical assumption of ${ch}`,
      ],
      correctAnswer: `Primary standard principle of ${ch}`,
      marks: mcqMarks,
      section: "A",
    });
  }

  // 2. Short Questions
  const shortCount = schemeStructure.short?.count ?? 0;
  const shortMarks = schemeStructure.short?.marksEach ?? 2;
  for (let i = 1; i <= shortCount; i++) {
    const ch = chapterTitles[(i - 1) % chapterTitles.length];
    drafts.push({
      type: "SHORT",
      text: `Define and state two practical applications of concepts covered in ${ch}.`,
      options: null,
      correctAnswer: `Standard textbook definition and two applications from ${ch}.`,
      marks: shortMarks,
      section: "B",
    });
  }

  // 3. Long Questions
  const longCount = schemeStructure.long?.count ?? 0;
  const longMarks = schemeStructure.long?.marksEach ?? 5;
  for (let i = 1; i <= longCount; i++) {
    const ch = chapterTitles[(i - 1) % chapterTitles.length];
    drafts.push({
      type: "LONG",
      text: `Comprehensive Theory / Numerical from ${ch}: Explain principles with diagrams and derived mathematical expressions.`,
      options: null,
      correctAnswer: `Detailed theoretical explanation and derivation covering ${ch}.`,
      marks: longMarks,
      section: "C",
    });
  }

  return drafts;
}

/**
 * Board-aware test paper generator strictly enforcing stored PaperScheme
 */
export async function generateBoardPaper(input: GenerateBoardPaperInput): Promise<{
  success: boolean;
  questions: QuestionDraft[];
  isFallback: boolean;
  error?: string;
}> {
  const { boardName, className, subject, chapters, scheme, difficulty } = input;
  const structure = scheme.structure;

  // Strict guard: Never generate a paper from a partial scheme lacking short or long sections
  const lacksShort = !structure?.short || !structure?.short?.count;
  const lacksLong = !structure?.long || !structure?.long?.count;
  if (lacksShort || lacksLong) {
    return {
      success: false,
      questions: [],
      isFallback: false,
      error:
        "Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao.",
    };
  }

  const fallbackQuestions = buildDeterministicSchemeQuestions(
    subject,
    chapters,
    structure
  );

  const config = getLLMConfig();
  if (!config.apiKey) {
    return {
      success: true,
      questions: fallbackQuestions,
      isFallback: true,
    };
  }

  const systemPrompt = `You are an expert Pakistani curriculum exam paper setter for ${boardName}.
You generate test papers strictly matching the official board pairing scheme JSON schema:
[
  {
    "type": "MCQ",
    "text": "Question text?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": ${structure.mcq?.marksEach ?? 1},
    "section": "A"
  },
  {
    "type": "SHORT",
    "text": "Short answer prompt?",
    "options": null,
    "correctAnswer": "Key grading points.",
    "marks": ${structure.short?.marksEach ?? 2},
    "section": "B"
  },
  {
    "type": "LONG",
    "text": "Long answer theory prompt?",
    "options": null,
    "correctAnswer": "Comprehensive marking key.",
    "marks": ${structure.long?.marksEach ?? 5},
    "section": "C"
  }
]
Output ONLY valid, parseable JSON array. No markdown codeblocks, commentary, or text outside the JSON.`;

  const chapterListStr = chapters
    .map((c) => `Chapter ${c.number}: ${c.title}`)
    .join("\n- ");

  const userPrompt = `Generate a ${difficulty} difficulty exam paper for:
Board: ${boardName}
Class: ${className}
Subject: ${subject}
Target Total Marks: ${scheme.totalMarks}

OFFICIAL PAIRING SCHEME STRUCTURE (MUST BE STRICTLY FOLLOWED):
${JSON.stringify(structure, null, 2)}

SELECTED CHAPTERS TO INCLUDE:
- ${chapterListStr}

CRITICAL RULES:
1. Generate questions in EXACTLY this structure. Do not add or remove sections.
2. Use ONLY the listed chapters above.
3. Section A: exactly ${structure.mcq?.count ?? 0} MCQs (${structure.mcq?.marksEach ?? 1} mark each).
4. Section B: exactly ${structure.short?.count ?? 0} SHORT questions (${structure.short?.marksEach ?? 2} marks each).
5. Section C: exactly ${structure.long?.count ?? 0} LONG questions (${structure.long?.marksEach ?? 5} marks each).
Output the JSON array now:`;

  // Attempt 1
  try {
    const rawContent = await callLLM(userPrompt, systemPrompt);
    const parsed = parseAndValidateQuestionsJson(rawContent);

    // Validate scheme conformity
    const schemeCheck = validatePaperAgainstScheme(
      parsed,
      structure,
      scheme.totalMarks
    );

    if (schemeCheck.valid) {
      return { success: true, questions: parsed, isFallback: false };
    }

    console.warn("[BOARD SCHEME VALIDATION FAILED - RETRYING]", schemeCheck.error);
    throw new Error(schemeCheck.error);
  } catch (firstErr: any) {
    // Attempt 2 (One retry with corrective prompt)
    try {
      const correctivePrompt = `${userPrompt}\n\nIMPORTANT: Your previous output failed scheme validation: ${firstErr.message}. Ensure exact question counts per section.`;
      const retryContent = await callLLM(correctivePrompt, systemPrompt);
      const parsedRetry = parseAndValidateQuestionsJson(retryContent);

      const schemeCheckRetry = validatePaperAgainstScheme(
        parsedRetry,
        structure,
        scheme.totalMarks
      );

      if (schemeCheckRetry.valid) {
        return { success: true, questions: parsedRetry, isFallback: false };
      }

      console.warn("[BOARD SCHEME RETRY FAILED]", schemeCheckRetry.error);
      return {
        success: false,
        questions: fallbackQuestions,
        isFallback: true,
        error: `LLM response rejected: ${schemeCheckRetry.error}. Generated structured template from verified scheme.`,
      };
    } catch (retryErr: any) {
      console.warn("[BOARD SCHEME GENERATION EXCEPTION]", retryErr.message);
      return {
        success: false,
        questions: fallbackQuestions,
        isFallback: true,
        error: `AI generation failed: ${retryErr.message}. Showing verified syllabus template.`,
      };
    }
  }
}
