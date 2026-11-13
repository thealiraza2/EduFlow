import { requireAdmin } from "@/lib/permissions";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, School } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminPage() {
  const admin = await requireAdmin();

  const [studentCount, teacherCount, classCount] = await Promise.all([
    db.student.count(),
    db.teacher.count(),
    db.class.count(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Admin Overview</h1>
        <p className="text-slate-500">Welcome, {admin.name} ({admin.email})</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Total Students</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount}</div>
            <p className="text-xs text-slate-500 mt-1">Enrolled and active students</p>
            <div className="mt-4">
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link href="/admin/students">Manage Students</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Teaching Staff</CardTitle>
            <GraduationCap className="h-5 w-5 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherCount}</div>
            <p className="text-xs text-slate-500 mt-1">Active faculty members</p>
            <div className="mt-4">
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link href="/admin/teachers">Manage Teachers</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Classes & Batches</CardTitle>
            <School className="h-5 w-5 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classCount}</div>
            <p className="text-xs text-slate-500 mt-1">Configured academy classes</p>
            <div className="mt-4">
              <Button size="sm" variant="outline" asChild className="w-full">
                <Link href="/admin/classes">Manage Classes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
