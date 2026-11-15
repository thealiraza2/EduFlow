import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const metadata = {
  title: "Change Password | EduFlow",
  description: "Update your account password",
};

export default async function ChangePasswordPage() {
  const session = await auth();

  // If not logged in, go to login
  if (!session?.user) {
    redirect("/login");
  }

  let dashboardUrl = "/admin";
  if (session.user.role === "SUPER_ADMIN") dashboardUrl = "/superadmin";
  else if (session.user.role === "TEACHER") dashboardUrl = "/teacher";
  else if (session.user.role === "PARENT") dashboardUrl = "/parent";
  else if (session.user.role === "STUDENT") dashboardUrl = "/student";

  const isForced = Boolean(session.user.mustChangePassword);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <ChangePasswordForm isForced={isForced} dashboardUrl={dashboardUrl} />
    </div>
  );
}
