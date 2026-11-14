import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateResultCardPdf } from "@/lib/pdf";
import { calculatePositions } from "@/lib/results";
import { Role } from "@prisma/client";

export async function GET(
  req: NextRequest,
  { params }: { params: { testId: string; studentId: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { testId, studentId } = params;

    const test = await db.test.findUnique({
      where: { id: testId },
      include: {
        batch: {
          include: {
            class: true,
          },
        },
        results: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 });
    }

    const targetResult = test.results.find((r) => r.studentId === studentId);
    if (!targetResult) {
      return NextResponse.json({ error: "Result not found for this student" }, { status: 404 });
    }

    // Role-based authorization
    if (session.user.role === Role.PARENT) {
      if (targetResult.student.guardianUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden: Not your child" }, { status: 403 });
      }
      if (test.status !== "PUBLISHED") {
        return NextResponse.json({ error: "Results for this test have not been published yet." }, { status: 403 });
      }
    } else if (session.user.role === Role.TEACHER) {
      const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacher || test.batch.teacherId !== teacher.id) {
        return NextResponse.json({ error: "Forbidden: Not your batch" }, { status: 403 });
      }
    }

    // Compute ranks and positions for all students in this test
    const rankedResults = calculatePositions(
      test.results.map((r) => ({
        id: r.id,
        obtainedMarks: r.obtainedMarks,
        studentId: r.studentId,
      })),
      test.totalMarks
    );

    const studentRank = rankedResults.find((r) => r.item.studentId === studentId);
    const positionStr = `${studentRank?.positionFormatted || "N/A"} / ${test.results.length} Students`;

    const testDateStr = test.date.toISOString().split("T")[0];

    const pdfBytes = await generateResultCardPdf({
      academyName: "AcademyHub Coaching Centre",
      studentName: targetResult.student.name,
      admissionNo: targetResult.student.admissionNo,
      className: test.batch.class.name,
      batchName: test.batch.name,
      testTitle: test.title,
      subject: test.subject,
      testDate: testDateStr,
      totalMarks: test.totalMarks,
      obtainedMarks: targetResult.obtainedMarks,
      percentage: studentRank?.percentage || 0,
      grade: studentRank?.grade || "F",
      classPosition: positionStr,
      teacherRemarks: targetResult.remarks,
      correctionLog: targetResult.correctionLog,
    });

    const filename = `result-card-${targetResult.student.admissionNo}-${test.title.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating result card PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate result card PDF" },
      { status: 500 }
    );
  }
}
