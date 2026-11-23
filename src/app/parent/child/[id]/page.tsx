import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getParentChildData } from "@/lib/parent";
import { AuthorizationError } from "@/lib/permissions";
import { ParentChildCard } from "@/components/parent/ParentChildCard";
import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "@/components/icons";
import { Button } from "@/components/ui/button";

export default async function ParentChildDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireRole([Role.PARENT, Role.ADMIN]);

  try {
    const childData = await getParentChildData(
      user.id,
      params.id,
      user.role as Role
    );

    return (
      <div className="min-h-screen bg-slate-50 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-3">
            <Link href="/parent">
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-serif text-2xl font-semibold text-slate-900">
                {childData.student.name} — Student Profile
              </h1>
              <p className="text-xs text-slate-500">
                Admission No: {childData.student.admissionNo} • Guardian Portal
              </p>
            </div>
          </div>

          <ParentChildCard child={childData} />
        </div>
      </div>
    );
  } catch (error: any) {
    if (error instanceof AuthorizationError || error.statusCode === 403) {
      return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 flex items-center justify-center">
          <div className="bg-white border border-rose-200 rounded-xl p-8 max-w-md text-center shadow-1 space-y-3" data-testid="forbidden-403">
            <ShieldAlert className="h-12 w-12 text-rose-600 mx-auto" />
            <h2 className="text-3xl font-semibold text-slate-900 font-mono">403</h2>
            <h3 className="text-lg font-semibold text-rose-800">Access Denied</h3>
            <p className="text-xs text-slate-600">
              You are not authorized to view this student profile. Under academy privacy policy, parents may only access records for their own registered children.
            </p>
            <div className="pt-2">
              <Link href="/parent">
                <Button size="sm" className="bg-slate-900 text-white text-xs">
                  Return to My Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }
    throw error;
  }
}
