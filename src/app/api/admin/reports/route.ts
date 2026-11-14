import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";
import {
  generateMonthlyFeeCollectionReportCsv,
  generateBatchAttendanceReportCsv,
  generateStudentPerformanceReportCsv,
  generateTeacherWorkloadReportCsv,
} from "@/lib/reports";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== Role.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "fees";
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const month = searchParams.get("month") || currentMonth;
    const batchId = searchParams.get("batchId") || undefined;

    let csvContent = "";
    let filename = `report-${type}-${month}.csv`;

    switch (type) {
      case "fees":
        csvContent = await generateMonthlyFeeCollectionReportCsv(month);
        filename = `fee-collection-${month}.csv`;
        break;
      case "attendance":
        csvContent = await generateBatchAttendanceReportCsv(month, batchId);
        filename = `attendance-${month}.csv`;
        break;
      case "performance":
        csvContent = await generateStudentPerformanceReportCsv(batchId);
        filename = `student-performance-${Date.now()}.csv`;
        break;
      case "teachers":
        csvContent = await generateTeacherWorkloadReportCsv();
        filename = `teacher-workload-${Date.now()}.csv`;
        break;
      default:
        return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating CSV report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}
