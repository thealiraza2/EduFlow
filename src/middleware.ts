import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Protect /admin routes -> requires ADMIN
  if (pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Administrator access required.", { status: 403 });
    }
  }

  // Protect /teacher routes -> requires TEACHER or ADMIN
  if (pathname.startsWith("/teacher")) {
    if (!user) {
      const loginUrl = new URL("/login", req.nextUrl.origin);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (user.role !== "TEACHER" && user.role !== "ADMIN") {
      return new NextResponse("Forbidden: Teacher access required.", { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/teacher/:path*"],
};
