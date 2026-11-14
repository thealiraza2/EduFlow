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

  // If user does not need to change password, redirect to home
  if (!session.user.mustChangePassword) {
    if (session.user.role === "SUPER_ADMIN") redirect("/superadmin");
    if (session.user.role === "ADMIN") redirect("/admin");
    if (session.user.role === "TEACHER") redirect("/teacher");
    if (session.user.role === "PARENT") redirect("/parent");
    if (session.user.role === "STUDENT") redirect("/student");
    redirect("/");
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <ChangePasswordForm />
    </div>
  );
}
