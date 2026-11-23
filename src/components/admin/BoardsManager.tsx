"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  createBoardAction,
  deleteBoardAction,
  createSubjectAction,
  deleteSubjectAction,
  createChapterAction,
  deleteChapterAction,
  savePaperSchemeAction,
  verifyPaperSchemeAction,
  deletePaperSchemeAction,
} from "@/lib/actions/boards";
import {
  School,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  FileCheck,
  ExternalLink,
  Layers,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
  Loader2,
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
  verifiedAt: string | Date | null;
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

interface Props {
  boards: BoardItem[];
}

export function BoardsManager({ boards }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [addBoardOpen, setAddBoardOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardProvince, setBoardProvince] = useState("Punjab");

  const [addSubjectOpen, setAddSubjectOpen] = useState(false);
  const [targetBoardId, setTargetBoardId] = useState("");
  const [className, setClassName] = useState("9th");
  const [subjectName, setSubjectName] = useState("");

  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [targetSubjectId, setTargetSubjectId] = useState("");
  const [chapterNumber, setChapterNumber] = useState<number>(1);
  const [chapterTitle, setChapterTitle] = useState("");

  const [schemeModalOpen, setSchemeModalOpen] = useState(false);
  const [schemeBoardId, setSchemeBoardId] = useState("");
  const [schemeClass, setSchemeClass] = useState("9th");
  const [schemeSubjectId, setSchemeSubjectId] = useState("");
  const [schemeSubjectName, setSchemeSubjectName] = useState("");

  // Scheme structured inputs (NOT raw JSON)
  const [mcqCount, setMcqCount] = useState<number>(12);
  const [mcqMarks, setMcqMarks] = useState<number>(1);
  const [shortCount, setShortCount] = useState<number>(8);
  const [shortMarks, setShortMarks] = useState<number>(2);
  const [shortAttempt, setShortAttempt] = useState<number>(5);
  const [longCount, setLongCount] = useState<number>(2);
  const [longMarks, setLongMarks] = useState<number>(5);
  const [longAttempt, setLongAttempt] = useState<number>(2);
  const [totalMarks, setTotalMarks] = useState<number>(38);
  const [timeMinutes, setTimeMinutes] = useState<number>(90);
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createBoardAction({ name: boardName, province: boardProvince });
        setAddBoardOpen(false);
        setBoardName("");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to create board.");
      }
    });
  };

  const handleDeleteBoard = (id: string, name: string) => {
    if (!confirm(`Delete board "${name}" and all its subjects, chapters, and schemes?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteBoardAction(id);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete board.");
      }
    });
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createSubjectAction({
          boardId: targetBoardId,
          className,
          name: subjectName,
        });
        setAddSubjectOpen(false);
        setSubjectName("");
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to create subject.");
      }
    });
  };

  const handleDeleteSubject = (id: string, name: string) => {
    if (!confirm(`Delete subject "${name}"?`)) return;
    setError(null);
    startTransition(async () => {
      try {
        await deleteSubjectAction(id);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete subject.");
      }
    });
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await createChapterAction({
          subjectId: targetSubjectId,
          number: chapterNumber,
          title: chapterTitle,
        });
        setAddChapterOpen(false);
        setChapterTitle("");
        setChapterNumber((prev) => prev + 1);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to add chapter.");
      }
    });
  };

  const handleDeleteChapter = (id: string) => {
    setError(null);
    startTransition(async () => {
      try {
        await deleteChapterAction(id);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete chapter.");
      }
    });
  };

  const openSchemeModal = (boardId: string, s: SubjectItem) => {
    setSchemeBoardId(boardId);
    setSchemeClass(s.className);
    setSchemeSubjectId(s.id);
    setSchemeSubjectName(s.name);

    const existing = s.schemes[0];
    if (existing) {
      const st = existing.structure as any;
      setMcqCount(st.mcq?.count ?? 12);
      setMcqMarks(st.mcq?.marksEach ?? 1);
      setShortCount(st.short?.count ?? 8);
      setShortMarks(st.short?.marksEach ?? 2);
      setShortAttempt(st.short?.attempt ?? 5);
      setLongCount(st.long?.count ?? 2);
      setLongMarks(st.long?.marksEach ?? 5);
      setLongAttempt(st.long?.attempt ?? 2);
      setTotalMarks(existing.totalMarks);
      setTimeMinutes(existing.timeMinutes ?? 90);
      setSourceUrl(existing.sourceUrl || "");
      setNotes(existing.notes || "");
    } else {
      setMcqCount(12);
      setMcqMarks(1);
      setShortCount(8);
      setShortMarks(2);
      setShortAttempt(5);
      setLongCount(2);
      setLongMarks(5);
      setLongAttempt(2);
      setTotalMarks(38);
      setTimeMinutes(90);
      setSourceUrl("");
      setNotes("");
    }
    setSchemeModalOpen(true);
  };

  const handleSaveScheme = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await savePaperSchemeAction({
          boardId: schemeBoardId,
          className: schemeClass,
          subjectId: schemeSubjectId,
          mcqCount,
          mcqMarks,
          shortCount,
          shortMarks,
          shortAttempt,
          longCount,
          longMarks,
          longAttempt,
          totalMarks,
          timeMinutes: timeMinutes || undefined,
          sourceUrl,
          notes: notes.trim() || undefined,
        });
        setSchemeModalOpen(false);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to save scheme.");
      }
    });
  };

  const handleToggleVerify = (schemeId: string, currentStatus: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await verifyPaperSchemeAction(schemeId, !currentStatus);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to update verification status.");
      }
    });
  };

  const handleDeleteScheme = (schemeId: string) => {
    if (!confirm("Are you sure you want to delete this pairing scheme?")) return;
    setError(null);
    startTransition(async () => {
      try {
        await deletePaperSchemeAction(schemeId);
        router.refresh();
      } catch (err: any) {
        setError(err.message || "Failed to delete scheme.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-xl border shadow-1">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 flex items-center">
            <School className="h-5 w-5 mr-2 text-indigo-600" />
            Educational Examination Boards & Pairing Schemes
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Store and verify official BISE board pairing schemes so AI generates exam papers with exact question distribution.
          </p>
        </div>

        <Button
          onClick={() => setAddBoardOpen(true)}
          size="sm"
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-1 flex items-center shrink-0"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Add Board
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Boards List */}
      {boards.length === 0 ? (
        <Card className="p-12 text-center text-slate-400">
          <School className="h-10 w-10 mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No boards configured yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Click &quot;Add Board&quot; above to create a board (e.g. BISE Lahore).
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {boards.map((b) => (
            <Card key={b.id} className="shadow-1 border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b py-3.5 px-5 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                    <School className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold text-slate-900">{b.name}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      Province: {b.province} • {b.subjects.length} Subjects
                    </CardDescription>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      setTargetBoardId(b.id);
                      setAddSubjectOpen(true);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Subject
                  </Button>
                  <Button
                    onClick={() => handleDeleteBoard(b.id, b.name)}
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-rose-600 h-8 w-8 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-5 space-y-5">
                {b.subjects.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No subjects added for {b.name}. Click &quot;Add Subject&quot; to configure classes and curriculum.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {b.subjects.map((sub) => {
                      const scheme = sub.schemes[0];
                      const isVerified = scheme?.verified;

                      return (
                        <div key={sub.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="font-mono text-xs font-semibold bg-slate-100">
                                {sub.className}
                              </Badge>
                              <span className="font-semibold text-sm text-slate-900">{sub.name}</span>
                              <span className="text-xs text-slate-400">
                                ({sub.chapters.length} Chapters)
                              </span>
                            </div>

                            <div className="flex items-center space-x-2">
                              <Button
                                onClick={() => {
                                  setTargetSubjectId(sub.id);
                                  setChapterNumber(sub.chapters.length + 1);
                                  setAddChapterOpen(true);
                                }}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2.5"
                              >
                                <Plus className="h-3 w-3 mr-1" /> Chapter
                              </Button>

                              <Button
                                onClick={() => openSchemeModal(b.id, sub)}
                                variant="outline"
                                size="sm"
                                className="text-xs h-7 px-2.5 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100"
                              >
                                <FileCheck className="h-3 w-3 mr-1" />
                                {scheme ? "Edit Scheme" : "Add Scheme"}
                              </Button>

                              <Button
                                onClick={() => handleDeleteSubject(sub.id, sub.name)}
                                variant="ghost"
                                size="sm"
                                className="text-slate-400 hover:text-rose-600 h-7 w-7 p-0"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Chapters List */}
                          <div className="flex flex-wrap items-center gap-1.5 pl-2">
                            <span className="text-xs text-slate-400 mr-1">Chapters:</span>
                            {sub.chapters.length === 0 ? (
                              <span className="text-xs text-slate-400 italic">No chapters added</span>
                            ) : (
                              sub.chapters.map((ch) => (
                                <Badge
                                  key={ch.id}
                                  variant="secondary"
                                  className="text-xs font-normal pl-2 pr-1 py-0.5 flex items-center space-x-1"
                                >
                                  <span>
                                    Ch {ch.number}: {ch.title}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteChapter(ch.id)}
                                    className="hover:text-rose-600 ml-1"
                                  >
                                    &times;
                                  </button>
                                </Badge>
                              ))
                            )}
                          </div>

                          {/* Pairing Scheme Display Card */}
                          {scheme ? (
                            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex items-center space-x-2">
                                  <span className="font-semibold text-slate-700">Pairing Scheme:</span>
                                  {isVerified ? (
                                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs font-semibold">
                                      <ShieldCheck className="h-3 w-3 mr-1" />
                                      VERIFIED
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-xs font-semibold">
                                      <ShieldAlert className="h-3 w-3 mr-1" />
                                      UNVERIFIED — confirm before use
                                    </Badge>
                                  )}

                                  {scheme.notes?.startsWith("PARTIAL:") && (
                                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 text-xs font-semibold">
                                      PARTIAL
                                    </Badge>
                                  )}

                                  {scheme.sourceUrl && (
                                    <a
                                      href={scheme.sourceUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-600 hover:underline inline-flex items-center text-xs"
                                    >
                                      Official Doc <ExternalLink className="h-3 w-3 ml-0.5" />
                                    </a>
                                  )}
                                </div>

                                <div className="flex items-center space-x-2">
                                  <Button
                                    onClick={() => handleToggleVerify(scheme.id, isVerified)}
                                    size="sm"
                                    variant="outline"
                                    className={`text-xs h-6 px-2 font-semibold ${
                                      isVerified
                                        ? "text-rose-700 hover:bg-rose-50 border-rose-200"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                    }`}
                                  >
                                    {isVerified ? "Unmark Verified" : "Mark Verified"}
                                  </Button>

                                  <Button
                                    onClick={() => handleDeleteScheme(scheme.id)}
                                    variant="ghost"
                                    size="sm"
                                    className="text-slate-400 hover:text-rose-600 text-xs h-6 px-1.5"
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </div>

                              {/* Structure details */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-xs">
                                <div className="p-2 bg-white rounded border">
                                  <span className="text-slate-400 block text-xs">MCQs:</span>
                                  <span className="font-semibold text-slate-800">
                                    {(scheme.structure as any)?.mcq?.count ?? 0} &times; {(scheme.structure as any)?.mcq?.marksEach ?? 1} mark
                                  </span>
                                </div>

                                <div className="p-2 bg-white rounded border">
                                  <span className="text-slate-400 block text-xs">Short Questions:</span>
                                  <span className="font-semibold text-slate-800">
                                    Attempt {(scheme.structure as any)?.short?.attempt ?? (scheme.structure as any)?.short?.count ?? 0} of {(scheme.structure as any)?.short?.count ?? 0} (&times;{(scheme.structure as any)?.short?.marksEach ?? 2}m)
                                  </span>
                                </div>

                                <div className="p-2 bg-white rounded border">
                                  <span className="text-slate-400 block text-xs">Long Questions:</span>
                                  <span className="font-semibold text-slate-800">
                                    Attempt {(scheme.structure as any)?.long?.attempt ?? (scheme.structure as any)?.long?.count ?? 0} of {(scheme.structure as any)?.long?.count ?? 0} (&times;{(scheme.structure as any)?.long?.marksEach ?? 5}m)
                                  </span>
                                </div>

                                <div className="p-2 bg-white rounded border">
                                  <span className="text-slate-400 block text-xs">Total & Time:</span>
                                  <span className="font-semibold text-indigo-700">
                                    {scheme.totalMarks} Marks ({scheme.timeMinutes ? `${scheme.timeMinutes} mins` : "Time unconfirmed"})
                                  </span>
                                </div>
                              </div>

                              {scheme.notes && (
                                <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                                  <span className="font-semibold text-slate-700 not-italic">Notes: </span>
                                  {scheme.notes}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200/60 text-xs text-amber-900 flex items-center justify-between">
                              <span className="text-xs">
                                No pairing scheme configured. AI generation will be disabled for this subject.
                              </span>
                              <Button
                                onClick={() => openSchemeModal(b.id, sub)}
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 bg-white border-amber-300"
                              >
                                Configure Scheme
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 1. Modal: Add Board */}
      <Dialog open={addBoardOpen} onOpenChange={setAddBoardOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Add Examination Board</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create an educational board (e.g. BISE Lahore, BISE Karachi, Federal Board).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateBoard} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Board Name *</label>
              <Input
                placeholder="e.g. BISE Rawalpindi"
                value={boardName}
                onChange={(e) => setBoardName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Province *</label>
              <select
                value={boardProvince}
                onChange={(e) => setBoardProvince(e.target.value)}
                className="w-full text-xs h-9 px-3 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Punjab">Punjab</option>
                <option value="Sindh">Sindh</option>
                <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option>
                <option value="Balochistan">Balochistan</option>
                <option value="Federal / Islamabad">Federal / Islamabad</option>
                <option value="Azad Kashmir">Azad Kashmir</option>
              </select>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddBoardOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="bg-indigo-600 text-white">
                {isPending ? "Creating..." : "Save Board"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Modal: Add Subject */}
      <Dialog open={addSubjectOpen} onOpenChange={setAddSubjectOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Add Subject to Board</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Specify class grade and subject name (e.g. 9th Physics, 10th Mathematics).
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubject} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Class Grade *</label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full text-xs h-9 px-3 border rounded-md bg-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="9th">9th</option>
                <option value="10th">10th</option>
                <option value="11th (FSc-1)">11th (FSc-1)</option>
                <option value="12th (FSc-2)">12th (FSc-2)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject Name *</label>
              <Input
                placeholder="e.g. Mathematics"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddSubjectOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="bg-indigo-600 text-white">
                {isPending ? "Saving..." : "Save Subject"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Modal: Add Chapter */}
      <Dialog open={addChapterOpen} onOpenChange={setAddChapterOpen}>
        <DialogContent className="max-w-md bg-white p-6 rounded-2xl shadow-3">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-900">Add Syllabus Chapter</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Add chapter number and official title according to curriculum textbook.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateChapter} className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter Number *</label>
              <Input
                type="number"
                min={1}
                value={chapterNumber}
                onChange={(e) => setChapterNumber(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chapter Title *</label>
              <Input
                placeholder="e.g. Work and Energy"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setAddChapterOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="bg-indigo-600 text-white">
                {isPending ? "Adding..." : "Add Chapter"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Modal: Pairing Scheme Builder (Structured Form, NOT Raw JSON) */}
      <Dialog open={schemeModalOpen} onOpenChange={setSchemeModalOpen}>
        <DialogContent className="max-w-xl bg-white p-6 rounded-2xl shadow-3 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center space-x-2">
              <FileCheck className="h-5 w-5 text-indigo-600" />
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Configure Paper Scheme: {schemeClass} {schemeSubjectName}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate-500">
              Input official board pairing scheme section rules. The form builds the exact JSON structure.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveScheme} className="space-y-5 pt-2">
            {/* Section 1: MCQs */}
            <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
              <h4 className="font-semibold text-xs text-slate-800 flex items-center">
                Section A: Multiple Choice Questions (MCQs)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">MCQ Count *</label>
                  <Input
                    type="number"
                    min={0}
                    value={mcqCount}
                    onChange={(e) => setMcqCount(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marks per MCQ *</label>
                  <Input
                    type="number"
                    step="0.5"
                    min={0.5}
                    value={mcqMarks}
                    onChange={(e) => setMcqMarks(parseFloat(e.target.value) || 1)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Short Questions */}
            <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
              <h4 className="font-semibold text-xs text-slate-800 flex items-center">
                Section B: Short Answer Questions
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Count *</label>
                  <Input
                    type="number"
                    min={0}
                    value={shortCount}
                    onChange={(e) => setShortCount(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Attempt Count *</label>
                  <Input
                    type="number"
                    min={0}
                    value={shortAttempt}
                    onChange={(e) => setShortAttempt(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marks Each *</label>
                  <Input
                    type="number"
                    min={1}
                    value={shortMarks}
                    onChange={(e) => setShortMarks(parseFloat(e.target.value) || 2)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Long Questions */}
            <div className="p-3.5 bg-slate-50 rounded-lg border space-y-2">
              <h4 className="font-semibold text-xs text-slate-800 flex items-center">
                Section C: Long / Theory Questions
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Total Count *</label>
                  <Input
                    type="number"
                    min={0}
                    value={longCount}
                    onChange={(e) => setLongCount(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Attempt Count *</label>
                  <Input
                    type="number"
                    min={0}
                    value={longAttempt}
                    onChange={(e) => setLongAttempt(parseInt(e.target.value, 10) || 0)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Marks Each *</label>
                  <Input
                    type="number"
                    min={1}
                    value={longMarks}
                    onChange={(e) => setLongMarks(parseFloat(e.target.value) || 5)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Overall totals */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Paper Marks *</label>
                <Input
                  type="number"
                  min={1}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(parseInt(e.target.value, 10) || 0)}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Minutes) *</label>
                <Input
                  type="number"
                  min={10}
                  value={timeMinutes}
                  onChange={(e) => setTimeMinutes(parseInt(e.target.value, 10) || 60)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Scheme URL / Reference (Optional)
              </label>
              <Input
                type="url"
                placeholder="https://biselahore.com/pairing-schemes/9th-physics.pdf"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Notes / Gaps Information (e.g. PARTIAL: details)
              </label>
              <Input
                type="text"
                placeholder="e.g. PARTIAL: short/long breakdown unconfirmed — see SOURCES.md"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setSchemeModalOpen(false)} size="sm">
                Cancel
              </Button>
              <Button type="submit" disabled={isPending} size="sm" className="bg-indigo-600 text-white font-semibold">
                {isPending ? "Saving Scheme..." : "Save Scheme"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
