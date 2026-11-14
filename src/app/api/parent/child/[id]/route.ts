import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getParentChildData } from "@/lib/parent";
import { AuthorizationError } from "@/lib/permissions";
import { Role } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const childId = params.id;
    const data = await getParentChildData(
      session.user.id,
      childId,
      session.user.role as Role
    );

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    if (error instanceof AuthorizationError || error.statusCode === 403) {
      return NextResponse.json(
        { error: error.message || "Forbidden: Access denied" },
        { status: 403 }
      );
    }
    if (error.statusCode === 404) {
      return NextResponse.json(
        { error: error.message || "Not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
