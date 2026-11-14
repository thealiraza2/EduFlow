import type { NextAuthConfig } from "next-auth";
import { Role } from "@prisma/client";

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role as Role;
        token.mustChangePassword = user.mustChangePassword;
        token.phone = user.phone;
        token.teacherId = user.teacherId;
        token.academyId = user.academyId;
        token.academySlug = user.academySlug;
        token.academyStatus = user.academyStatus;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.mustChangePassword = token.mustChangePassword;
        session.user.phone = token.phone;
        session.user.teacherId = token.teacherId;
        session.user.academyId = token.academyId;
        session.user.academySlug = token.academySlug;
        session.user.academyStatus = token.academyStatus;
      }
      return session;
    },
  },
  providers: [], // Credential provider attached in auth.ts
};
