"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import Link from "next/link";

interface EnrolledStudentItem {
  id: string; // enrollmentId
  status: string; // enrollment status
  enrolledAt: string;
  student: {
    id: string;
    admissionNo: string;
    name: string;
    guardianName: string;
    guardianPhone: string;
    status: string; // student status
  };
}

export function BatchRosterModal({
  batchName,
  className,
  capacity,
  enrollments,
}: {
  batchName: string;
  className: string;
  capacity: number;
  enrollments: EnrolledStudentItem[];
}) {
  const [open, setOpen] = useState(false);

  // Invariant: LEFT students keep their history but disappear from attendance sheets and batch active rosters
  const activeEnrollments = enrollments.filter(
    (e) => e.status === "ACTIVE" && e.student.status === "ACTIVE"
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="h-8 px-2 text-xs">
          <Users className="h-3.5 w-3.5 mr-1" />
          Roster ({activeEnrollments.length}/{capacity})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between pr-6">
            <DialogTitle>
              {className} — {batchName} Active Roster
            </DialogTitle>
            <Badge variant="outline">
              {activeEnrollments.length} Active / {capacity} Max
            </Badge>
          </div>
          <DialogDescription>
            Official active student roster for attendance and billing.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {activeEnrollments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-sm border rounded-lg bg-slate-50">
              No active students enrolled in this batch yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-[120px]">Admission No</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Contact Phone</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeEnrollments.map((enr) => (
                  <TableRow key={enr.id}>
                    <TableCell className="font-mono text-xs font-semibold text-slate-900">
                      {enr.student.admissionNo}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900">
                      {enr.student.name}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {enr.student.guardianName}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">
                      {enr.student.guardianPhone}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs">
                        <Link href={`/admin/students/${enr.student.id}`} onClick={() => setOpen(false)}>
                          Profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
