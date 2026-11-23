"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, Trash2, UserX, UserCheck, RefreshCw, AlertTriangle } from "@/components/icons";
import { TeacherStatus } from "@prisma/client";
import { formatPKR } from "@/lib/money";
import { deleteTeacherAction, updateTeacherStatusAction } from "@/lib/actions/teachers";

interface TeacherListItem {
  id: string;
  salaryMinor: number;
  subjects: string[];
  status: TeacherStatus;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
  batches: {
    id: string;
    name: string;
    class: {
      name: string;
      section: string;
    };
  }[];
}

interface TeacherListProps {
  teachers: TeacherListItem[];
}

export function TeacherList({ teachers }: TeacherListProps) {
  const [search, setSearch] = useState("");
  const [deletingTeacher, setDeletingTeacher] = useState<TeacherListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = teachers.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.user.name.toLowerCase().includes(q) ||
      t.user.email.toLowerCase().includes(q) ||
      (t.user.phone && t.user.phone.includes(q)) ||
      t.subjects.some((s) => s.toLowerCase().includes(q))
    );
  });

  async function handleDelete() {
    if (!deletingTeacher) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await deleteTeacherAction(deletingTeacher.id);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete teacher");
      } else {
        setDeletingTeacher(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete teacher");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleStatus(teacher: TeacherListItem) {
    const nextStatus = teacher.status === TeacherStatus.ACTIVE ? TeacherStatus.INACTIVE : TeacherStatus.ACTIVE;
    setStatusLoadingId(teacher.id);
    try {
      await updateTeacherStatusAction({
        teacherId: teacher.id,
        status: nextStatus,
      });
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    } finally {
      setStatusLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-md text-xs flex items-center space-x-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="flex items-center space-x-2 max-w-sm">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by faculty name, email, subject..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Teacher Name</TableHead>
              <TableHead>Contact & Email</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Assigned Batches</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                  No teachers found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((teacher) => (
                <TableRow key={teacher.id} className="hover:bg-slate-50">
                  <TableCell className="font-semibold text-slate-900">
                    {teacher.user.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{teacher.user.email}</div>
                    <div className="text-xs text-slate-500 font-mono">
                      {teacher.user.phone || "No phone"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {teacher.subjects.map((sub, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {sub}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {teacher.batches.length === 0 ? (
                      <span className="text-xs text-slate-400 italic">No batches assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {teacher.batches.map((b) => (
                          <Badge key={b.id} variant="secondary" className="text-xs">
                            {b.class.name}-{b.class.section} {b.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900 font-mono">
                    {formatPKR(teacher.salaryMinor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === TeacherStatus.ACTIVE ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(teacher)}
                        disabled={statusLoadingId === teacher.id}
                        className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                        title={teacher.status === TeacherStatus.ACTIVE ? "Deactivate Teacher" : "Activate Teacher"}
                      >
                        {statusLoadingId === teacher.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : teacher.status === TeacherStatus.ACTIVE ? (
                          <>
                            <UserX className="h-3.5 w-3.5 mr-1 text-amber-600" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                            Activate
                          </>
                        )}
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingTeacher(teacher)}
                        className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                        title="Delete Teacher Record"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingTeacher} onOpenChange={(open) => !open && setDeletingTeacher(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center text-rose-700">
              <AlertTriangle className="h-5 w-5 mr-2 text-rose-600" />
              Confirm Teacher Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to permanently delete faculty member{" "}
              <strong className="text-slate-900">{deletingTeacher?.user.name}</strong> (
              <span className="font-mono text-slate-700">{deletingTeacher?.user.email}</span>)?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
            <p className="font-semibold">This action cannot be undone:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-700">
              <li>Batches assigned to this teacher will be unlinked.</li>
              <li>Timetable slots and schedule assignments will be cleared.</li>
              <li>Teacher login account will be permanently removed.</li>
            </ul>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingTeacher(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isDeleting ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Deleting...
                </>
              ) : (
                "Delete Teacher Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
