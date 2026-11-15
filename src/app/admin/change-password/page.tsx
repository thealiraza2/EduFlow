import { requireAdmin } from "@/lib/permissions";
import { ChangePasswordForm } from "@/app/(public)/change-password/ChangePasswordForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Change Password | EduFlow Admin",
};

export default async function AdminChangePasswordPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex justify-center py-6">
        <ChangePasswordForm isForced={false} dashboardUrl="/admin" />
      </div>
    </div>
  );
}
