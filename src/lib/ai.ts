/**
 * EduFlow - AI helper (risk explanations).
 *
 * INVARIANT 12: Deterministic code does the deciding; LLM only does the wording.
 * - Credentials from environment ONLY (LLM_API_KEY, LLM_MODEL, LLM_ENDPOINT).
 * - Every call is bound by a strict 15-second AbortSignal timeout.
 * - If the LLM fails or is unconfigured, we fall back to deterministic text.
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
    return `${fallback} (AI insights unavailable — connect an AI key in Settings)`;
  }

  const prompt = `Write ONE concise, plain-language sentence in English explaining this student's dropout risk.
Facts:
- Student: ${input.studentName}
- Attendance (last 30 days): ${input.attendancePct}%
- Fee overdue months: ${input.overdueMonths}
- Marks trend: ${input.marksTrend}
- Dropout Risk Level (computed by system): ${input.riskLevel}

Example output format: "${input.studentName}'s attendance is ${input.attendancePct}% and fee is ${input.overdueMonths} months overdue — dropout risk is ${input.riskLevel}."
Return ONLY the one sentence, without quotes or additional commentary.`;

  try {
    const response = await callLLM(prompt, "You are an assistant for Pakistani tuition academy administrators.");
    return response.replace(/^["']|["']$/g, "").trim() || fallback;
  } catch (err: any) {
    console.warn("[AI RISK EXPLANATION FALLBACK]", err.message);
    return `${fallback} (AI insights unavailable — connect an AI key in Settings)`;
  }
}
