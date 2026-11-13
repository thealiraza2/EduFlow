import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function TeacherPage() {
  // Master prompt & Phase 1: Admin can also view /teacher
  const user = await requireRole([Role.TEACHER, Role.ADMIN]);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Teacher Portal</h1>
            <p className="text-slate-500">Attendance, Marks & Batch Overview</p>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {user.role}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome, {user.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Authorized Role:</strong> {user.role}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
