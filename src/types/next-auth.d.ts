import { Role } from "@prisma/client";
import { DefaultSession } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      phone?: string | null;
      teacherId?: string | null;
      academyId?: string | null;
      academySlug?: string | null;
      academyStatus?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    id?: string;
    role: Role;
    phone?: string | null;
    teacherId?: string | null;
    academyId?: string | null;
    academySlug?: string | null;
    academyStatus?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
    phone?: string | null;
    teacherId?: string | null;
    academyId?: string | null;
    academySlug?: string | null;
    academyStatus?: string | null;
  }
}
