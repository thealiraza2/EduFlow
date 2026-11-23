import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { getParentChildData } from "@/lib/parent";
import { AuthorizationError } from "@/lib/permissions";
import { ParentChildCard } from "@/components/parent/ParentChildCard";
import { ArrowLeft, ShieldAlert } from "@/components/icons";
import { ButtonLink, PageHeader } from "@/components/dashboard/kit";

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
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          eyebrow={<span className="font-mono">{childData.student.admissionNo}</span>}
          title={childData.student.name}
          description="Attendance, fees, results and timetable, as the school records them."
          actions={
            <ButtonLink href="/parent" variant="secondary" icon={ArrowLeft}>
              My children
            </ButtonLink>
          }
        />
        <div className="overflow-hidden rounded-[22px] border border-line bg-surface p-1 shadow-1">
          <ParentChildCard child={childData} />
        </div>
      </div>
    );
  } catch (error: any) {
    if (error instanceof AuthorizationError || error.statusCode === 403) {
      return (
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="max-w-md space-y-3 rounded-[22px] border border-line bg-surface p-8 text-center shadow-2" data-testid="forbidden-403">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-status-danger-bg text-status-danger">
              <ShieldAlert className="h-6 w-6" />
            </span>
            <h2 className="font-serif text-[26px] font-bold tracking-[-0.02em] text-ink">You can&apos;t view this profile</h2>
            <p className="text-[14px] leading-relaxed text-ink-2">
              Parents can only see records for their own registered children.
            </p>
            <div className="pt-2">
              <ButtonLink href="/parent">Back to my children</ButtonLink>
            </div>
          </div>
        </div>
      );
    }
    throw error;
  }
}
