"use client";

import { useState } from "react";
import Link from "next/link";
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
import { Search, Eye, Trash2, UserX, UserCheck, RefreshCw, AlertTriangle } from "lucide-react";
import { StudentStatus } from "@prisma/client";
import { deleteStudentAction, updateStudentStatusAction } from "@/lib/actions/students";

interface StudentListItem {
  id: string;
  admissionNo: string;
  name: string;
  guardianName: string;
  guardianPhone: string;
  status: StudentStatus;
  enrollments: {
    id: string;
    status: string;
    batch: {
      name: string;
      class: {
        name: string;
        section: string;
      };
    };
  }[];
}

export function StudentList({ students }: { students: StudentListItem[] }) {
  const [search, setSearch] = useState("");
  const [deletingStudent, setDeletingStudent] = useState<StudentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q)
    );
  });

  async function handleDelete() {
    if (!deletingStudent) return;
    setIsDeleting(true);
    setErrorMessage(null);
    try {
      const res = await deleteStudentAction(deletingStudent.id);
      if (!res.success) {
        setErrorMessage(res.error || "Failed to delete student");
      } else {
        setDeletingStudent(null);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to delete student");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleToggleStatus(student: StudentListItem) {
    const nextStatus = student.status === "ACTIVE" ? StudentStatus.LEFT : StudentStatus.ACTIVE;
    setStatusLoadingId(student.id);
    try {
      await updateStudentStatusAction({
        studentId: student.id,
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
            placeholder="Search by name, admission no, phone..."
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
              <TableHead className="w-[140px]">Admission No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Guardian Details</TableHead>
              <TableHead>Enrolled Batches</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No students found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student) => {
                const activeBatches = student.enrollments.filter((e) => e.status === "ACTIVE");

                return (
                  <TableRow key={student.id} className="hover:bg-slate-50">
                    <TableCell className="font-mono font-medium text-xs text-slate-900">
                      {student.admissionNo}
                    </TableCell>
                    <TableCell className="font-semibold text-slate-900">
                      {student.name}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900">{student.guardianName}</div>
                      <div className="text-xs text-slate-500 font-mono">{student.guardianPhone}</div>
                    </TableCell>
                    <TableCell>
                      {activeBatches.length === 0 ? (
                        <span className="text-xs text-slate-400 italic">No active batches</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {activeBatches.map((e) => (
                            <Badge key={e.id} variant="secondary" className="text-xs px-1.5 py-0">
                              {e.batch.class.name}-{e.batch.class.section} {e.batch.name}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          student.status === "ACTIVE"
                            ? "default"
                            : student.status === "LEFT"
                            ? "secondary"
                            : "destructive"
                        }
                        className="text-xs uppercase"
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs">
                          <Link href={`/admin/students/${student.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1 text-slate-500" />
                            View Profile
                          </Link>
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(student)}
                          disabled={statusLoadingId === student.id}
                          className="h-8 px-2 text-xs text-slate-600 hover:text-slate-900"
                          title={student.status === "ACTIVE" ? "Deactivate Student (Mark Left)" : "Reactivate Student"}
                        >
                          {statusLoadingId === student.id ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          ) : student.status === "ACTIVE" ? (
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
                          onClick={() => setDeletingStudent(student)}
                          className="h-8 px-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          title="Delete Student Record"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingStudent} onOpenChange={(open) => !open && setDeletingStudent(null)}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-lg flex items-center text-rose-700">
              <AlertTriangle className="h-5 w-5 mr-2 text-rose-600" />
              Confirm Student Deletion
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-600">
              Are you sure you want to permanently delete student{" "}
              <strong className="text-slate-900">{deletingStudent?.name}</strong> (
              <span className="font-mono font-semibold text-slate-800">{deletingStudent?.admissionNo}</span>)?
            </DialogDescription>
          </DialogHeader>

          <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-xs text-rose-800 space-y-1">
            <p className="font-semibold">This action cannot be undone:</p>
            <ul className="list-disc list-inside space-y-0.5 text-xs text-rose-700">
              <li>Batch enrollments and attendance logs will be wiped.</li>
              <li>Fee invoices, challans, and payment receipts will be deleted.</li>
              <li>Test attempts, answer logs, and assessment scores will be removed.</li>
              <li>Linked student login account (if created) will be removed.</li>
            </ul>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingStudent(null)}
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
                "Delete Student Record"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
