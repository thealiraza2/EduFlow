"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  generatePaperDraftAction,
  saveDraftGeneratedTestAction,
} from "@/lib/actions/ai-tests";
import { QuestionDraft } from "@/lib/ai";
import { CURRICULUM_TOPICS } from "@/lib/risk";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowRight,
  BookOpen,
  HelpCircle,
  FileCheck,
  RotateCcw,
  Loader2,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  class: {
    name: string;
    section: string;
  };
}

interface Props {
  batches: BatchItem[];
  defaultSubject?: string;
  teacherSubjects?: string[];
}

export function AITestPaperGenerator({ batches, defaultSubject, teacherSubjects = [] }: Props) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  // Generator inputs
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || "");
  const [subject, setSubject] = useState<string>(
    defaultSubject || teacherSubjects[0] || "Physics"
  );
  const [customSubject, setCustomSubject] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");
  const [totalMarks, setTotalMarks] = useState<number>(25);
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [mcqCount, setMcqCount] = useState<number>(4);
  const [shortCount, setShortCount] = useState<number>(1);
  const [durationMinutes, setDurationMinutes] = useState<number>(30);
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // Draft review state
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const activeSubject = subject === "OTHER" ? customSubject : subject;
  const suggestedTopics = CURRICULUM_TOPICS[activeSubject] || [];

  const handleAddTopic = (t: string) => {
    const trimmed = t.trim();
    if (trimmed && !selectedTopics.includes(trimmed)) {
      setSelectedTopics([...selectedTopics, trimmed]);
      setTopicInput("");
    }
  };

  const handleRemoveTopic = (t: string) => {
    setSelectedTopics(selectedTopics.filter((x) => x !== t));
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(null);

    if (!activeSubject) {
      setError("Please specify a subject.");
      return;
    }

    const topicsToUse =
      selectedTopics.length > 0
        ? selectedTopics
        : suggestedTopics.slice(0, 2);

    if (topicsToUse.length === 0) {
      setError("Please add at least one topic or syllabus chapter.");
      return;
    }

    startGenerating(async () => {
      try {
        const result = await generatePaperDraftAction({
          subject: activeSubject,
          topics: topicsToUse,
          totalMarks,
          difficulty,
          mcqCount,
          shortCount,
        });

        setQuestions(result.questions);
        setIsFallback(result.isFallback);
        setGenerationNotice(
          result.isFallback
            ? "AI unavailable — showing syllabus template only. You can adjust and customize all questions below."
            : "AI paper draft generated successfully! Review, edit questions and marks below, then save as DRAFT test."
        );
        setTestTitle(`${activeSubject} - ${topicsToUse[0] || "Assessment"} (${difficulty})`);
      } catch (err: any) {
        setError(err.message || "Failed to generate test draft.");
      }
    });
  };

  // Question editing handlers
  const handleUpdateQuestion = (index: number, updated: Partial<QuestionDraft>) => {
    setQuestions((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated } as QuestionDraft;
      return copy;
    });
  };

  const handleUpdateOption = (qIndex: number, optIndex: number, val: string) => {
    setQuestions((prev) => {
      const copy = [...prev];
      const q = copy[qIndex];
      if (q.options) {
        const newOpts = [...q.options];
        newOpts[optIndex] = val;
        copy[qIndex] = { ...q, options: newOpts };
      }
      return copy;
    });
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddQuestion = (type: "MCQ" | "SHORT") => {
    const marksPerQ = Math.max(1, Math.round(totalMarks / (questions.length + 1)));
    if (type === "MCQ") {
      setQuestions((prev) => [
        ...prev,
        {
          type: "MCQ",
          text: `New ${activeSubject} question?`,
          options: ["Option A", "Option B", "Option C", "Option D"],
          correctAnswer: "Option A",
          marks: marksPerQ,
        },
      ]);
    } else {
      setQuestions((prev) => [
        ...prev,
        {
          type: "SHORT",
          text: `Describe key concept in ${activeSubject}:`,
          options: null,
          correctAnswer: "Expected key concepts in answer.",
          marks: marksPerQ,
        },
      ]);
    }
  };

  const currentQuestionsMarks = questions.reduce((sum, q) => sum + (q.marks || 0), 0);

  const handleSaveDraft = () => {
    setError(null);
    if (!batchId) {
      setError("Please select a target batch.");
      return;
    }
    if (!testTitle.trim()) {
      setError("Please enter a test title.");
      return;
    }
    if (questions.length === 0) {
      setError("Test paper must contain at least one question.");
      return;
    }

    startSaving(async () => {
      try {
        const res = await saveDraftGeneratedTestAction({
          batchId,
          subject: activeSubject,
          title: testTitle.trim(),
          totalMarks: currentQuestionsMarks > 0 ? currentQuestionsMarks : totalMarks,
          durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
          negativeMarking: negativeMarking >= 0 ? negativeMarking : 0,
          questions,
        });

        setSavedSuccess(`Test saved as DRAFT successfully! Title: "${res.title}"`);
        setTimeout(() => {
          router.push(`/teacher/tests?testId=${res.testId}`);
        }, 1200);
      } catch (err: any) {
        setError(err.message || "Failed to save draft test.");
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Generator Configuration Card */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-sm">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold text-slate-900">
                  AI Test Paper Generator
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Configure topics and syllabus objectives. Deterministic code selects curriculum topics; AI drafts questions.
                </CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50/50">
              Groq LLaMA-3.1 / Deterministic Fallback
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Batch Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Batch *
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.class.name} {b.class.section} - {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject *
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md text-sm bg-white focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="Physics">Physics</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Biology">Biology</option>
                  <option value="English">English</option>
                  <option value="OTHER">Other / Custom</option>
                </select>
                {subject === "OTHER" && (
                  <Input
                    placeholder="Enter subject name..."
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                    className="mt-2 text-sm"
                    required
                  />
                )}
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDifficulty(diff)}
                      className={`h-10 text-xs font-semibold rounded-md border transition-all ${
                        difficulty === diff
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Topics & Syllabus tags */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Syllabus Topics & Focus Areas
              </label>

              {/* Suggested curriculum chips */}
              {suggestedTopics.length > 0 && (
                <div className="mb-2.5 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-400 mr-1">
                    Standard Curriculum:
                  </span>
                  {suggestedTopics.map((top) => {
                    const isSelected = selectedTopics.includes(top);
                    return (
                      <button
                        key={top}
                        type="button"
                        onClick={() =>
                          isSelected ? handleRemoveTopic(top) : handleAddTopic(top)
                        }
                        className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
                          isSelected
                            ? "bg-indigo-100 border-indigo-300 text-indigo-800 font-semibold"
                            : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {isSelected ? `✓ ${top}` : `+ ${top}`}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Selected topics tags + custom input */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 border rounded-lg bg-slate-50/50">
                {selectedTopics.map((top) => (
                  <Badge
                    key={top}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white pl-2.5 pr-1.5 py-1 text-xs flex items-center space-x-1"
                  >
                    <span>{top}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(top)}
                      className="hover:text-rose-200 ml-1"
                    >
                      &times;
                    </button>
                  </Badge>
                ))}

                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Input
                    placeholder="Type custom topic and press Enter..."
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTopic(topicInput);
                      }
                    }}
                    className="h-8 text-xs bg-white"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddTopic(topicInput)}
                    className="h-8 text-xs shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Marks & Question Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Marks
                </label>
                <Input
                  type="number"
                  min={5}
                  max={100}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 20)}
                  className="h-9 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  MCQs Count
                </label>
                <Input
                  type="number"
                  min={0}
                  max={20}
                  value={mcqCount}
                  onChange={(e) => setMcqCount(parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Short Questions
                </label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={shortCount}
                  onChange={(e) => setShortCount(parseInt(e.target.value, 10) || 0)}
                  className="h-9 text-sm bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Online Duration (mins)
                </label>
                <Input
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                  className="h-9 text-sm bg-white"
                />
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-500">
                15-second timeout safety. If LLM is unreachable, deterministic syllabus template is returned.
              </p>
              <Button
                type="submit"
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 h-10 shadow-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Draft...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Draft Paper
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error & Notices */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg flex items-center space-x-3 text-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {generationNotice && (
        <div
          className={`p-4 rounded-lg border flex items-center space-x-3 text-sm ${
            isFallback
              ? "bg-amber-50 border-amber-200 text-amber-900"
              : "bg-emerald-50 border-emerald-200 text-emerald-900"
          }`}
        >
          {isFallback ? (
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          )}
          <span>{generationNotice}</span>
        </div>
      )}

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-lg flex items-center space-x-3 text-sm">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
          <span className="font-semibold">{savedSuccess}</span>
        </div>
      )}

      {/* Questions Review & Editing Area */}
      {questions.length > 0 && (
        <Card className="shadow-md border-indigo-100">
          <CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-bold text-slate-900">
                  Review & Customize Draft Test
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Edit question wording, correct answers, or marks before finalizing into DRAFT status.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Badge
                variant="outline"
                className={`text-xs font-mono font-bold px-3 py-1 ${
                  currentQuestionsMarks === totalMarks
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}
              >
                Total: {currentQuestionsMarks} / {totalMarks} Marks
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {questions.length} Questions
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Test Title Input */}
            <div className="p-4 bg-white rounded-lg border space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Title (Displayed to Students & Parents)
                </label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 3 Kinematics Test"
                  className="font-medium text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Wrong MCQ Penalty (Negative Marking)
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="2"
                    value={negativeMarking}
                    onChange={(e) => setNegativeMarking(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Exam Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 30)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Question Cards List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-lg border bg-white shadow-sm space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <Badge
                        className={`text-[10px] font-bold ${
                          q.type === "MCQ"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : "bg-purple-100 text-purple-800 border-purple-200"
                        }`}
                      >
                        {q.type}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-slate-500 font-medium">Marks:</span>
                        <Input
                          type="number"
                          step="0.5"
                          min="0.5"
                          value={q.marks}
                          onChange={(e) =>
                            handleUpdateQuestion(idx, {
                              marks: parseFloat(e.target.value) || 1,
                            })
                          }
                          className="h-7 w-16 text-xs text-center font-mono font-semibold"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteQuestion(idx)}
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Question Text
                    </label>
                    <textarea
                      value={q.text}
                      onChange={(e) => handleUpdateQuestion(idx, { text: e.target.value })}
                      className="w-full text-sm p-2.5 border rounded-md focus:ring-1 focus:ring-indigo-500 min-h-[60px]"
                      rows={2}
                    />
                  </div>

                  {/* MCQ Options */}
                  {q.type === "MCQ" && q.options && (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[11px] font-semibold text-slate-500">
                        Options & Correct Answer (Select radio for correct answer)
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => (
                          <div
                            key={optIdx}
                            className={`flex items-center space-x-2 p-2 rounded-md border text-xs ${
                              q.correctAnswer === opt
                                ? "bg-emerald-50 border-emerald-300"
                                : "bg-slate-50 border-slate-200"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`correct-answer-${idx}`}
                              checked={q.correctAnswer === opt}
                              onChange={() => handleUpdateQuestion(idx, { correctAnswer: opt })}
                              className="text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                            />
                            <span className="font-bold text-slate-500 w-4">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                              className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-xs text-slate-800"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Short Question Key */}
                  {q.type === "SHORT" && (
                    <div className="pt-1">
                      <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                        Expected Key Points / Answer Key
                      </label>
                      <Input
                        value={q.correctAnswer}
                        onChange={(e) =>
                          handleUpdateQuestion(idx, { correctAnswer: e.target.value })
                        }
                        className="text-xs bg-slate-50 font-mono"
                        placeholder="Key grading points..."
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Questions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion("MCQ")}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add MCQ
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion("SHORT")}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Short Question
                </Button>
              </div>

              {/* Save Button */}
              <Button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 h-10 shadow-sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving Draft Test...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save as DRAFT Test
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
