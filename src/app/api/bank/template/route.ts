import { NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions";
import { csvTemplate } from "@/lib/bank/csv";

export async function GET() {
  try {
    await requireSuperAdmin();
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return new NextResponse(csvTemplate(), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="eduflow-question-bank-template.csv"',
    },
  });
}
