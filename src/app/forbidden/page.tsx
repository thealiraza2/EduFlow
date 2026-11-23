import { auth } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ArrowLeft, KeyRound, LogOut } from "@/components/icons";
import { SignOutButton } from "@/components/common/SignOutButton";

export const metadata = {
  title: "Access Restricted (403) | EduFlow",
};

export default async function ForbiddenPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const session = await auth();
  const resolvedParams = await searchParams;
  const reason = resolvedParams?.reason || "You do not have permission to access this resource.";

  let dashboardUrl = "/login";
  let dashboardLabel = "Back to Login";
  let roleLabel = "";

  if (session?.user) {
    if (session.user.role === "SUPER_ADMIN") {
      dashboardUrl = "/superadmin";
      dashboardLabel = "Back to Super Admin Portal";
      roleLabel = "Super Admin";
    } else if (session.user.role === "ADMIN") {
      dashboardUrl = "/admin";
      dashboardLabel = "Back to Admin Dashboard";
      roleLabel = "Administrator";
    } else if (session.user.role === "TEACHER") {
      dashboardUrl = "/teacher";
      dashboardLabel = "Back to Teacher Portal";
      roleLabel = "Teacher";
    } else if (session.user.role === "PARENT") {
      dashboardUrl = "/parent";
      dashboardLabel = "Back to Parent Portal";
      roleLabel = "Parent / Guardian";
    } else if (session.user.role === "STUDENT") {
      dashboardUrl = "/student";
      dashboardLabel = "Back to Student Portal";
      roleLabel = "Student";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center space-x-3">
              <Link href={dashboardUrl} className="text-xl font-semibold tracking-tight text-slate-900">
                EduFlow
              </Link>
              {roleLabel && (
                <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700">
                  {roleLabel}
                </Badge>
              )}
            </div>

            <div className="flex items-center space-x-2">
              {session?.user && (
                <>
                  <span className="hidden sm:inline-block text-xs text-slate-500 mr-2 font-medium">
                    {session.user.email}
                  </span>
                  <Link href="/change-password">
                    <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                      <KeyRound className="h-4 w-4 mr-1.5" />
                      <span className="hidden sm:inline">Password</span>
                    </Button>
                  </Link>
                  <SignOutButton />
                </>
              )}
              {!session?.user && (
                <Button variant="default" size="sm" asChild>
                  <Link href="/login">Log In</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full shadow-2 border-rose-200">
          <CardHeader className="text-center space-y-2">
            <div className="flex justify-center mb-1">
              <div className="p-3 bg-rose-100 rounded-full text-rose-700">
                <ShieldAlert className="h-8 w-8" />
              </div>
            </div>
            <div className="flex justify-center">
              <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 font-mono text-xs">
                403 Forbidden
              </Badge>
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900">
              Access Restricted
            </CardTitle>
            <CardDescription className="text-sm text-slate-600">
              {reason}
            </CardDescription>
          </CardHeader>

          <CardContent className="text-center text-xs text-slate-500 space-y-2">
            <p>
              Your current account does not have permission to view the requested destination. If you think this is an error, please sign in with an authorized account or contact your academy administrator.
            </p>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white" asChild>
              <Link href={dashboardUrl}>
                <ArrowLeft className="h-4 w-4 mr-1.5" />
                {dashboardLabel}
              </Link>
            </Button>
            {session?.user && (
              <SignOutButton
                variant="outline"
                className="w-full text-slate-700 hover:text-rose-600 border-slate-200"
              />
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
