import { requireAdmin } from "@/lib/permissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-slate-500">AcademyHub Management Console</p>
          </div>
          <Badge variant="default" className="px-3 py-1">
            {admin.role}
          </Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back, {admin.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-600">
            <p><strong>Email:</strong> {admin.email}</p>
            <p><strong>Role:</strong> {admin.role}</p>
            <p><strong>Session ID:</strong> {admin.id}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
