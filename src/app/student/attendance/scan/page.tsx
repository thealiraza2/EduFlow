import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";
import { db } from "@/lib/db";
import { verifyQRToken } from "@/lib/qr";
import { StudentQRScanConfirm } from "@/components/student/StudentQRScanConfirm";
import Link from "next/link";
import { ArrowLeft, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  searchParams: { token?: string };
}

export default async function StudentQRScanPage({ searchParams }: Props) {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);
  const token = searchParams.token || "";

  // 1. Verify token format and cryptographic signature
  const verification = verifyQRToken(token);

  let batchInfo: {
    name: string;
    className: string;
    section: string;
    timing: string;
  } | null = null;

  let alreadyMarked = false;

  // 2. If token valid, fetch batch details and check previous attendance
  if (verification.valid && verification.payload) {
    const { batchId, academyId, date: dateStr } = verification.payload;

    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: { class: true },
    });

    if (batch) {
      batchInfo = {
        name: batch.name,
        className: batch.class.name,
        section: batch.class.section,
        timing: batch.timing,
      };

      // Check student enrollment & existing attendance
      const student = await db.student.findFirst({
        where: {
          userId: user.id,
          academyId,
        },
      });

      if (student) {
        const enrollment = await db.enrollment.findFirst({
          where: {
            studentId: student.id,
            batchId,
            academyId,
          },
        });

        if (enrollment) {
          const targetDate = new Date(`${dateStr}T00:00:00.000Z`);
          const existing = await db.attendance.findFirst({
            where: {
              enrollmentId: enrollment.id,
              date: targetDate,
            },
          });
          if (existing) {
            alreadyMarked = true;
          }
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex flex-col justify-center">
      <div className="max-w-md mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <Link href="/student">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="text-xs font-medium text-slate-500 flex items-center">
            <QrCode className="h-3.5 w-3.5 mr-1 text-indigo-600" />
            AcademyHub QR Attendance
          </div>
        </div>

        <StudentQRScanConfirm
          token={token}
          verification={verification}
          batchInfo={batchInfo}
          studentName={user.name || "Student"}
          alreadyMarked={alreadyMarked}
        />
      </div>
    </div>
  );
}
