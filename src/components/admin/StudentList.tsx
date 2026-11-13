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
import { Search, Eye } from "lucide-react";
import { StudentStatus } from "@prisma/client";

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

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.admissionNo.toLowerCase().includes(q) ||
      s.guardianName.toLowerCase().includes(q) ||
      s.guardianPhone.includes(q)
    );
  });

  return (
    <div className="space-y-4">
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

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
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
                            <Badge key={e.id} variant="secondary" className="text-[11px] px-1.5 py-0">
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
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/students/${student.id}`}>
                          <Eye className="h-4 w-4 mr-1 text-slate-500" />
                          View Profile
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
