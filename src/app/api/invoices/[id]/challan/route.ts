import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateFeeChallanPdf } from "@/lib/pdf";
import { calculateRemainingBalance } from "@/lib/fees";
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

    const invoiceId = params.id;
    const invoice = await db.feeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        academy: true,
        student: true,
        batch: {
          include: {
            class: true,
            feePlan: true,
          },
        },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Multi-tenant check: if user belongs to an academy, invoice must match
    if (session.user.academyId && invoice.academyId !== session.user.academyId) {
      return NextResponse.json({ error: "Forbidden: Access denied" }, { status: 403 });
    }

    // Role-based authorization
    if (session.user.role === Role.PARENT) {
      if (invoice.student.guardianUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden: Not your child" }, { status: 403 });
      }
    } else if (session.user.role === Role.TEACHER) {
      const teacher = await db.teacher.findUnique({ where: { userId: session.user.id } });
      if (!teacher || invoice.batch.teacherId !== teacher.id) {
        return NextResponse.json({ error: "Forbidden: Not your batch" }, { status: 403 });
      }
    }

    // Calculate totals and remaining
    const totalPaidMinor = invoice.payments.reduce((sum, p) => sum + p.amountMinor, 0);
    const remainingMinor = calculateRemainingBalance(invoice.totalMinor, totalPaidMinor);

    const dueDay = invoice.batch.feePlan?.dueDayOfMonth ?? 10;
    const [year, month] = invoice.month.split("-");
    const dueDateFormatted = `${dueDay}-${month}-${year}`;

    const pdfBytes = await generateFeeChallanPdf({
      challanNo: `CH-${invoice.month.replace("-", "")}-${invoice.student.admissionNo.replace(/[^a-zA-Z0-9]/g, "")}`,
      academyName: invoice.academy?.name || "AcademyHub Coaching Centre",
      studentName: invoice.student.name,
      admissionNo: invoice.student.admissionNo,
      className: invoice.batch.class.name,
      batchName: invoice.batch.name,
      month: invoice.month,
      monthlyFeeMinor: invoice.amountMinor,
      lateFineMinor: invoice.fineMinor,
      discountMinor: invoice.discountMinor,
      totalMinor: invoice.totalMinor,
      paidMinor: totalPaidMinor,
      remainingMinor,
      status: invoice.status,
      dueDate: dueDateFormatted,
    });

    const filename = `challan-${invoice.student.admissionNo}-${invoice.month}.pdf`;

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": pdfBytes.byteLength.toString(),
      },
    });
  } catch (error: any) {
    console.error("Error generating challan PDF:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate challan PDF" },
      { status: 500 }
    );
  }
}
