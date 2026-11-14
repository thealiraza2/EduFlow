import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, Clock, Trophy, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function StudentPortalPage() {
  const user = await requireRole([Role.STUDENT, Role.ADMIN]);

  const student = await db.student.findFirst({
    where: { userId: user.id },
    include: {
      enrollments: {
        where: { status: "ACTIVE" },
        include: {
          batch: {
            include: {
              class: true,
              tests: {
                where: { status: "PUBLISHED", durationMinutes: { not: null } },
                orderBy: { createdAt: "desc" },
                include: {
                  attempts: {
                    where: {
                      student: { userId: user.id },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!student) {
    // If admin or unlinked student, redirect to first online test
    const firstTest = await db.test.findFirst({
      where: { durationMinutes: { not: null }, status: "PUBLISHED" },
    });
    if (firstTest) {
      redirect(`/student/test/${firstTest.id}`);
    }
  }

  const allTests = student?.enrollments.flatMap((e) =>
    e.batch.tests.map((t) => ({
      ...t,
      batchName: `${e.batch.class.name} ${e.batch.name}`,
      myAttempt: t.attempts[0] || null,
    }))
  ) || [];

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Student Welcome Header */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-slate-900">Student Portal</h1>
              <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300 text-xs">
                Active Student
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Welcome, <strong>{student?.name || user.name}</strong> • Roll No: <strong>{student?.admissionNo}</strong>
            </p>
          </div>

          <Badge variant="secondary" className="font-mono text-xs">
            {allTests.length} Assigned Tests
          </Badge>
        </div>

        {/* Online Assessments List */}
        <Card className="shadow-sm">
          <CardHeader className="border-b bg-slate-50/50 py-4 px-6">
            <CardTitle className="text-base font-bold text-slate-900 flex items-center">
              <FileSpreadsheet className="h-5 w-5 mr-2 text-emerald-600" />
              Assigned Online Tests & Assessments
            </CardTitle>
            <CardDescription className="text-xs">
              Timed MCQ tests taken in the browser with server-side auto-grading.
            </CardDescription>
          </CardHeader>

          <CardContent className="p-0">
            {allTests.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No online tests assigned to your batches yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {allTests.map((test) => {
                  const attempt = test.myAttempt;
                  const isCompleted = attempt && (attempt.status === "SUBMITTED" || attempt.status === "GRADED");

                  return (
                    <div
                      key={test.id}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-slate-900 text-sm">{test.title}</h3>
                          <Badge variant="outline" className="text-[10px]">
                            {test.subject}
                          </Badge>
                          {test.durationMinutes && (
                            <Badge variant="secondary" className="text-[10px] font-mono">
                              <Clock className="h-3 w-3 mr-1" />
                              {test.durationMinutes} mins
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500">
                          Batch: {test.batchName} • Total Marks: {test.totalMarks}
                          {test.negativeMarking > 0 && ` • Negative Marking: -${test.negativeMarking}`}
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        {isCompleted ? (
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                                Score
                              </span>
                              <span className="font-mono font-bold text-emerald-600 text-sm">
                                {attempt.score} / {test.totalMarks}
                              </span>
                            </div>

                            <Link href={`/student/test/${test.id}`}>
                              <Button size="sm" variant="outline" className="text-xs flex items-center">
                                <Trophy className="h-3.5 w-3.5 mr-1 text-amber-500" />
                                <span>Leaderboard</span>
                              </Button>
                            </Link>
                          </div>
                        ) : (
                          <Link href={`/student/test/${test.id}`}>
                            <Button size="sm" className="bg-slate-900 hover:bg-slate-800 text-white text-xs flex items-center">
                              <span>Start Test</span>
                              <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
