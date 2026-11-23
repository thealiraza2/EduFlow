import { requireAdmin } from "@/lib/permissions";
import { ChangePasswordForm } from "@/app/(public)/change-password/ChangePasswordForm";

export const metadata = {
  title: "Change password | EduFlow Admin",
};

export default async function AdminChangePasswordPage() {
  await requireAdmin();

  return (
    <div className="rounded-lg border border-line bg-surface p-6 shadow-1 sm:p-10">
      <ChangePasswordForm isForced={false} dashboardUrl="/admin" />
    </div>
  );
}
