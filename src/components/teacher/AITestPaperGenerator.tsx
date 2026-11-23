"use client";

import { useState, useTransition, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  generateBoardPaperAction,
  saveDraftGeneratedTestAction,
} from "@/lib/actions/ai-tests";
import { QuestionDraft } from "@/lib/ai";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ArrowRight,
  BookOpen,
  FileCheck,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  School,
  ExternalLink,
} from "lucide-react";

interface ChapterItem {
  id: string;
  number: number;
  title: string;
}

interface SchemeItem {
  id: string;
  boardId: string;
  className: string;
  subjectId: string;
  structure: any;
  totalMarks: number;
  timeMinutes: number | null;
  sourceUrl: string | null;
  verified: boolean;
  notes?: string | null;
}

interface SubjectItem {
  id: string;
  className: string;
  name: string;
  chapters: ChapterItem[];
  schemes: SchemeItem[];
}

interface BoardItem {
  id: string;
  name: string;
  province: string;
  subjects: SubjectItem[];
}

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
  boards?: BoardItem[];
  defaultSubject?: string;
  teacherSubjects?: string[];
}

export function AITestPaperGenerator({ batches, boards = [] }: Props) {
  const router = useRouter();
  const [isGenerating, startGenerating] = useTransition();
  const [isSaving, startSaving] = useTransition();

  // 1. Chained Selectors: Board -> Class -> Subject -> Chapters
  const [selectedBoardId, setSelectedBoardId] = useState<string>(boards[0]?.id || "");
  const currentBoard = useMemo(
    () => boards.find((b) => b.id === selectedBoardId) || boards[0] || null,
    [boards, selectedBoardId]
  );

  // Available classes for selected board
  const availableClasses = useMemo(() => {
    if (!currentBoard) return [];
    return Array.from(new Set(currentBoard.subjects.map((s) => s.className)));
  }, [currentBoard]);

  const [selectedClass, setSelectedClass] = useState<string>(
    availableClasses[0] || "9th"
  );

  // Available subjects for selected board & class
  const availableSubjects = useMemo(() => {
    if (!currentBoard) return [];
    return currentBoard.subjects.filter((s) => s.className === selectedClass);
  }, [currentBoard, selectedClass]);

  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || ""
  );

  // Active subject & its pairing scheme
  const activeSubject = useMemo(
    () => availableSubjects.find((s) => s.id === selectedSubjectId) || availableSubjects[0] || null,
    [availableSubjects, selectedSubjectId]
  );

  const activeScheme = activeSubject?.schemes[0] || null;
  const lacksShort = !activeScheme?.structure?.short || !activeScheme?.structure?.short?.count;
  const lacksLong = !activeScheme?.structure?.long || !activeScheme?.structure?.long?.count;
  const isPartialScheme = Boolean(
    activeScheme &&
      (lacksShort || lacksLong || activeScheme.notes?.startsWith("PARTIAL:"))
  );
  const availableChapters = activeSubject?.chapters || [];

  // Chapters multi-select state
  const [selectedChapterIds, setSelectedChapterIds] = useState<string[]>([]);

  // Other form state
  const [batchId, setBatchId] = useState<string>(batches[0]?.id || "");
  const [difficulty, setDifficulty] = useState<"EASY" | "MEDIUM" | "HARD">("MEDIUM");
  const [durationMinutes, setDurationMinutes] = useState<number>(
    activeScheme?.timeMinutes || 90
  );
  const [negativeMarking, setNegativeMarking] = useState<number>(0.25);

  // Draft review state
  const [testTitle, setTestTitle] = useState("");
  const [questions, setQuestions] = useState<QuestionDraft[]>([]);
  const [isFallback, setIsFallback] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null);

  const handleToggleChapter = (chId: string) => {
    setSelectedChapterIds((prev) =>
      prev.includes(chId) ? prev.filter((id) => id !== chId) : [...prev, chId]
    );
  };

  const handleSelectAllChapters = () => {
    setSelectedChapterIds(availableChapters.map((c) => c.id));
  };

  const handleClearChapters = () => {
    setSelectedChapterIds([]);
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedSuccess(null);

    if (!activeSubject) {
      setError("Please select a subject.");
      return;
    }

    if (!activeScheme) {
      setError("Is board/subject ki scheme save nahi hai — pehle /admin/boards mein scheme add karo.");
      return;
    }

    const lacksShort = !activeScheme.structure?.short || !activeScheme.structure?.short?.count;
    const lacksLong = !activeScheme.structure?.long || !activeScheme.structure?.long?.count;
    const isPartial = lacksShort || lacksLong || Boolean(activeScheme.notes?.startsWith("PARTIAL:"));

    if (isPartial) {
      setError("Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao.");
      return;
    }

    const chosenChapters =
      selectedChapterIds.length > 0
        ? availableChapters.filter((c) => selectedChapterIds.includes(c.id))
        : availableChapters;

    if (chosenChapters.length === 0) {
      setError("Please select at least one syllabus chapter.");
      return;
    }

    startGenerating(async () => {
      try {
        const result = await generateBoardPaperAction({
          boardName: currentBoard?.name || "BISE Lahore",
          className: activeSubject.className,
          subject: activeSubject.name,
          chapters: chosenChapters.map((c) => ({
            number: c.number,
            title: c.title,
          })),
          scheme: {
            id: activeScheme.id,
            structure: activeScheme.structure,
            totalMarks: activeScheme.totalMarks,
            timeMinutes: activeScheme.timeMinutes ?? null,
            verified: activeScheme.verified,
          },
          difficulty,
        });

        setQuestions(result.questions);
        setIsFallback(result.isFallback);
        setGenerationNotice(
          result.isFallback
            ? "AI unavailable — generated structured questions conforming to the official pairing scheme."
            : "AI test paper generated successfully according to the official board pairing scheme!"
        );
        setTestTitle(
          `${currentBoard?.name || "Board"} ${activeSubject.name} (${activeSubject.className}) - ${difficulty}`
        );
        if (activeScheme.timeMinutes) {
          setDurationMinutes(activeScheme.timeMinutes);
        }
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

  const handleAddQuestion = (type: "MCQ" | "SHORT" | "LONG") => {
    const marks = type === "LONG" ? 5 : type === "SHORT" ? 2 : 1;
    setQuestions((prev) => [
      ...prev,
      {
        type,
        text: `New ${activeSubject?.name || "Exam"} ${type} question:`,
        options: type === "MCQ" ? ["Option A", "Option B", "Option C", "Option D"] : null,
        correctAnswer: type === "MCQ" ? "Option A" : "Detailed key points.",
        marks,
        section: type === "MCQ" ? "A" : type === "SHORT" ? "B" : "C",
      },
    ]);
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
          subject: activeSubject?.name || "Exam",
          title: testTitle.trim(),
          totalMarks: activeScheme?.totalMarks || currentQuestionsMarks,
          durationMinutes: durationMinutes > 0 ? durationMinutes : undefined,
          negativeMarking: negativeMarking >= 0 ? negativeMarking : 0,
          schemeId: activeScheme?.id,
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
      <Card className="shadow-1 border-slate-200">
        <CardHeader className="bg-gradient-to-r from-indigo-50/80 via-white to-blue-50/50 border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-indigo-600 rounded-lg text-white shadow-1">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-slate-900">
                  Board-Aware AI Test Paper Generator
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Select Board, Class, Subject, and Chapters. Questions are strictly constructed within stored, verified pairing schemes.
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="border-indigo-300 text-indigo-700 bg-indigo-50/50 text-xs">
                Invariant: AI never invents pairing schemes
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Chained Selector Row 1: Board -> Class -> Subject -> Target Batch */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Board Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center">
                  <School className="h-3.5 w-3.5 mr-1 text-indigo-600" />
                  Education Board *
                </label>
                <select
                  value={selectedBoardId}
                  onChange={(e) => {
                    setSelectedBoardId(e.target.value);
                    const b = boards.find((x) => x.id === e.target.value);
                    if (b && b.subjects.length > 0) {
                      setSelectedClass(b.subjects[0].className);
                      setSelectedSubjectId(b.subjects[0].id);
                      setSelectedChapterIds([]);
                    }
                  }}
                  className="w-full h-10 px-3 border rounded-md text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {boards.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.province})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Class Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Class Grade *
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    const sub = currentBoard?.subjects.find((s) => s.className === e.target.value);
                    if (sub) {
                      setSelectedSubjectId(sub.id);
                      setSelectedChapterIds([]);
                    }
                  }}
                  className="w-full h-10 px-3 border rounded-md text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Subject Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSelectedChapterIds([]);
                  }}
                  className="w-full h-10 px-3 border rounded-md text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Target Batch */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Batch *
                </label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full h-10 px-3 border rounded-md text-xs bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                  required
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.class.name} {b.class.section} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Scheme Status Banner */}
            {activeScheme ? (
              <div className="space-y-3">
                <div
                  className={`p-4 rounded-xl border text-xs space-y-2 ${
                    activeScheme.verified
                      ? "bg-emerald-50/60 border-emerald-200 text-emerald-950"
                      : "bg-amber-50/60 border-amber-200 text-amber-950"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">Loaded Pairing Scheme:</span>
                      {activeScheme.verified ? (
                        <Badge className="bg-emerald-600 text-white text-xs font-semibold py-0.5">
                          <ShieldCheck className="h-3 w-3 mr-1" />
                          VERIFIED BOARD SCHEME
                        </Badge>
                      ) : (
                        <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-semibold py-0.5">
                          <ShieldAlert className="h-3 w-3 mr-1" />
                          UNVERIFIED — confirm before use
                        </Badge>
                      )}

                      {/* PARTIAL Badge */}
                      {isPartialScheme && (
                        <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold py-0.5">
                          PARTIAL SCHEME
                        </Badge>
                      )}

                      {activeScheme.sourceUrl && (
                        <a
                          href={activeScheme.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center text-xs"
                        >
                          Source Document <ExternalLink className="h-3 w-3 ml-0.5" />
                        </a>
                      )}
                    </div>

                    <span className="font-mono text-xs font-semibold text-slate-700">
                      Total: {activeScheme.totalMarks} Marks • Duration: {activeScheme.timeMinutes ? `${activeScheme.timeMinutes} mins` : "Time unconfirmed"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-xs">
                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-xs">Section A (MCQs):</span>
                      <span className="font-semibold text-slate-800">
                        {(activeScheme.structure as any)?.mcq?.count ?? 0} &times; {(activeScheme.structure as any)?.mcq?.marksEach ?? 1} mark
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-xs">Section B (Short Questions):</span>
                      <span className="font-semibold text-slate-800">
                        Attempt {(activeScheme.structure as any)?.short?.attempt ?? (activeScheme.structure as any)?.short?.count ?? 0} of {(activeScheme.structure as any)?.short?.count ?? 0} (&times;{(activeScheme.structure as any)?.short?.marksEach ?? 2}m)
                      </span>
                    </div>

                    <div className="p-2 bg-white rounded border">
                      <span className="text-slate-400 block text-xs">Section C (Long Questions):</span>
                      <span className="font-semibold text-slate-800">
                        Attempt {(activeScheme.structure as any)?.long?.attempt ?? (activeScheme.structure as any)?.long?.count ?? 0} of {(activeScheme.structure as any)?.long?.count ?? 0} (&times;{(activeScheme.structure as any)?.long?.marksEach ?? 5}m)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Partial Scheme Guard Notice */}
                {isPartialScheme && (
                  <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start space-x-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-semibold">
                        Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao.
                      </p>
                      <p className="text-xs text-amber-700">
                        Paper generation is disabled for partial schemes to prevent creating non-compliant exam papers. Short or long section breakdown is unconfirmed.
                      </p>
                      {activeScheme.notes && (
                        <p className="text-xs text-slate-600 italic bg-white/80 p-2 rounded border border-amber-200 mt-1">
                          Notes: {activeScheme.notes}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl text-xs flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">
                    Is board/subject ki scheme save nahi hai — pehle /admin/boards mein scheme add karo.
                  </p>
                  <p className="text-xs text-rose-700">
                    AI generation is disabled to prevent fabricating non-compliant exam papers.
                  </p>
                  <Link href="/admin/boards" className="text-indigo-600 underline font-medium inline-block mt-1">
                    Open Boards & Schemes Manager &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* Chapters Multi-Select */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Select Chapters to Include in Examination ({selectedChapterIds.length}/{availableChapters.length} Selected)
                </label>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleSelectAllChapters}
                    className="text-xs text-indigo-600 hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearChapters}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {availableChapters.length === 0 ? (
                <div className="p-4 bg-slate-50 border rounded-lg text-xs text-slate-400 text-center">
                  No syllabus chapters added for this subject yet. Add chapters via /admin/boards.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-3 bg-slate-50/70 border rounded-xl">
                  {availableChapters.map((ch) => {
                    const isSelected = selectedChapterIds.includes(ch.id);
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleToggleChapter(ch.id)}
                        className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all flex items-start space-x-2 ${
                          isSelected
                            ? "bg-indigo-50 border-indigo-300 text-indigo-950 font-medium shadow-xs"
                            : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // handled by parent div
                          className="mt-0.5 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 rounded"
                        />
                        <span className="text-xs leading-tight">
                          <strong>Ch {ch.number}:</strong> {ch.title}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Difficulty Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Difficulty Level
              </label>
              <div className="grid grid-cols-3 gap-3 max-w-sm">
                {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`h-9 text-xs font-semibold rounded-md border transition-all ${
                      difficulty === diff
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-1"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">
                  15s timeout safety. LLM strictly respects the stored pairing scheme counts.
                </p>
                {isPartialScheme && (
                  <p className="text-xs text-amber-700 font-semibold flex items-center">
                    <AlertTriangle className="h-3.5 w-3.5 mr-1 shrink-0" />
                    Is scheme ka mukammal structure save nahi hai — admin se /admin/boards mein complete karwao.
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={isGenerating || !activeScheme || isPartialScheme}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-6 h-10 shadow-1 shrink-0 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating Paper according to Scheme...
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

      {/* Errors & Notices */}
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

      {/* Questions Review & Editing Screen */}
      {questions.length > 0 && (
        <Card className="shadow-2 border-indigo-100">
          <CardHeader className="bg-slate-50 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-4">
            <div>
              <div className="flex items-center space-x-2">
                <FileCheck className="h-5 w-5 text-indigo-600" />
                <CardTitle className="text-base font-semibold text-slate-900">
                  Review & Customize Draft Test
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Review questions, options, marking keys, or make final adjustments before saving into DRAFT status.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="text-xs font-mono font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border-emerald-300">
                Target Marks: {activeScheme?.totalMarks || currentQuestionsMarks}
              </Badge>
              <Badge variant="secondary" className="font-mono text-xs">
                {questions.length} Questions
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {/* Test Title & Online Settings */}
            <div className="p-4 bg-white rounded-lg border space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Title (Displayed to Students & Parents)
                </label>
                <Input
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="e.g. BISE Lahore Physics 9th Midterm"
                  className="font-medium text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Exam Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value, 10) || 60)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Questions List */}
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-lg border bg-white shadow-1 space-y-3 transition-all hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="h-6 w-6 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <Badge
                        className={`text-xs font-semibold ${
                          q.type === "MCQ"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : q.type === "SHORT"
                            ? "bg-purple-100 text-purple-800 border-purple-200"
                            : "bg-emerald-100 text-emerald-800 border-emerald-200"
                        }`}
                      >
                        {q.section ? `Section ${q.section}: ` : ""}
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
                    <label className="block text-xs font-semibold text-slate-500 mb-1">
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
                      <label className="block text-xs font-semibold text-slate-500">
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
                            <span className="font-semibold text-slate-500 w-4">
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

                  {/* Short / Long Answer Key */}
                  {(q.type === "SHORT" || q.type === "LONG") && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold text-slate-500 mb-1">
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

            {/* Actions Bar */}
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
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Short
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddQuestion("LONG")}
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Long
                </Button>
              </div>

              <Button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 h-10 shadow-1"
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
