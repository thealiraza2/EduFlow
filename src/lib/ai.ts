/**
 * AcademyHub - AI LLM Provider Interface & Test Paper Generator (Phase 13)
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
  type: z.enum(["MCQ", "SHORT"]),
  text: z.string().min(5, "Question text must be at least 5 characters"),
  options: z.array(z.string()).min(2, "MCQs must have at least 2 options").max(6).optional().nullable(),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  marks: z.number().positive("Marks must be positive"),
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
