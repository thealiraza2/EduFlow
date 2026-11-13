import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { AddTeacherModal } from "@/components/admin/AddTeacherModal";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function TeachersPage() {
  await requireAdmin();

  const teachers = await db.teacher.findMany({
    include: {
      user: true,
      batches: {
        include: {
          class: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Faculty & Teachers</h1>
          <p className="text-slate-500">
            Manage teacher user accounts, subjects, salaries, and assigned batches.
          </p>
        </div>
        <AddTeacherModal />
      </div>

      <div className="rounded-md border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Teacher Name</TableHead>
              <TableHead>Contact & Email</TableHead>
              <TableHead>Subjects</TableHead>
              <TableHead>Assigned Batches</TableHead>
              <TableHead>Monthly Salary</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teachers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                  No teachers registered yet. Click &quot;Add New Teacher&quot; above to hire faculty.
                </TableCell>
              </TableRow>
            ) : (
              teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="font-semibold text-slate-900">
                    {teacher.user.name}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-900">{teacher.user.email}</div>
                    <div className="text-xs text-slate-500 font-mono">{teacher.user.phone || "No phone"}</div>
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
                  <TableCell className="font-medium text-slate-900">
                    {formatPKR(teacher.salaryMinor)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "ACTIVE" ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
