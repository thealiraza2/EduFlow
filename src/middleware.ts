import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import { extractSubdomain } from "@/lib/tenant";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Resolve tenant from subdomain or user session
  const host = req.headers.get("host");
  const subdomain = extractSubdomain(host);
  const tenantSlug = subdomain || user?.academySlug || "main";
  const tenantId = user?.academyId || "seed-academy-id";

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-tenant-slug", tenantSlug);
  requestHeaders.set("x-tenant-id", tenantId);

  // Forced Password Change Protection (Fix 1 & Fix 7)
  if (
    user?.mustChangePassword &&
    !pathname.startsWith("/change-password") &&
    !pathname.startsWith("/api/auth") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/api/webhooks")
  ) {
    // API routes under mustChangePassword return JSON 403 (Fix 7)
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Forbidden: Password change required before accessing API." },
        { status: 403 }
      );
    }
    const changePwdUrl = new URL("/change-password", req.nextUrl.origin);
    return NextResponse.redirect(changePwdUrl);
  }

  // Suspended Academy Protection
  if (
    user &&
    user.role !== "SUPER_ADMIN" &&
    user.academyStatus === "SUSPENDED" &&
    !pathname.startsWith("/suspended") &&
    !pathname.startsWith("/login") &&
    !pathname.startsWith("/api/auth")
  ) {
    return new NextResponse(
      "Forbidden: This academy account is currently suspended. Please contact platform support.",
      { status: 403 }
    );
  }

  // Protect /superadmin routes -> requires SUPER_ADMIN
  if (pathname.startsWith("/superadmin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden: Super Administrator access required.", { status: 403 });
    }
  }

  // Protect /admin routes -> requires ADMIN or SUPER_ADMIN
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden: Administrator access required.", { status: 403 });
    }
  }

  // Protect /teacher routes -> requires TEACHER or ADMIN/SUPER_ADMIN
  if (pathname.startsWith("/teacher")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "TEACHER" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden: Teacher access required.", { status: 403 });
    }
  }

  // Protect /parent routes -> requires PARENT or ADMIN/SUPER_ADMIN
  if (pathname.startsWith("/parent")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "PARENT" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden: Parent access required.", { status: 403 });
    }
  }

  // Protect /student routes -> requires STUDENT or ADMIN/SUPER_ADMIN
  if (pathname.startsWith("/student")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "STUDENT" && user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
      return new NextResponse("Forbidden: Student access required.", { status: 403 });
    }
  }

  // Defense-in-depth API route protections (Fix 7)
  if (pathname.startsWith("/api/")) {
    const isPublicApi =
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/health") ||
      pathname.startsWith("/api/webhooks") ||
      pathname.startsWith("/api/contact");

    if (!isPublicApi && !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
});

export const config = {
  matcher: [
    "/superadmin/:path*",
    "/admin/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/student/:path*",
    "/change-password",
    "/api/:path*",
  ],
};
