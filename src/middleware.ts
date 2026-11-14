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
  ],
};
