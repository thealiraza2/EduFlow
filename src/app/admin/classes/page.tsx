import { requireAdmin } from "@/lib/permissions";
import { requireTenant } from "@/lib/tenant";
import { db } from "@/lib/db";
import { formatPKR } from "@/lib/money";
import { AddClassModal } from "@/components/admin/AddClassModal";
import { AddBatchModal } from "@/components/admin/AddBatchModal";
import { AssignTeacherModal } from "@/components/admin/AssignTeacherModal";
import { BatchRosterModal } from "@/components/admin/BatchRosterModal";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, GraduationCap, DollarSign, School } from "@/components/icons";

export default async function ClassesPage() {
  await requireAdmin();
  const tenant = await requireTenant();

  const [classes, teachers] = await Promise.all([
    db.class.findMany({
      where: { academyId: tenant.academyId },
      include: {
        batches: {
          include: {
            teacher: {
              include: {
                user: true,
              },
            },
            enrollments: {
              include: {
                student: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    db.teacher.findMany({
      where: {
        academyId: tenant.academyId,
        status: "ACTIVE",
      },
      include: { user: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-slate-900">Classes & Batches</h1>
          <p className="text-slate-500">
            Structure academic grade levels, schedule batch timings, and assign subject faculty.
          </p>
        </div>
        <AddClassModal />
      </div>

      {classes.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="space-y-3">
            <School className="h-10 w-10 text-slate-400 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-900">No classes configured</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Get started by adding your first academic class (e.g. 9th Grade, Section A).
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="overflow-hidden shadow-1">
              <CardHeader className="bg-slate-50/70 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between py-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-xl font-semibold text-slate-900">
                      Class {cls.name}
                    </CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">
                      Section {cls.section}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Max Class Capacity: {cls.capacity} students
                  </CardDescription>
                </div>
                <div className="mt-3 sm:mt-0">
                  <AddBatchModal
                    classId={cls.id}
                    className={`${cls.name}-${cls.section}`}
                    teachers={teachers}
                  />
                </div>
              </CardHeader>

              <CardContent className="p-6">
                {cls.batches.length === 0 ? (
                  <p className="text-sm text-slate-400 italic text-center py-4">
                    No batches created in this class yet. Click &quot;Add Batch&quot; above.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cls.batches.map((batch) => {
                      const activeEnrollmentsCount = batch.enrollments.filter(
                        (e) => e.status === "ACTIVE" && e.student.status === "ACTIVE"
                      ).length;

                      const serializedEnrollments = batch.enrollments.map((e) => ({
                        id: e.id,
                        status: e.status,
                        enrolledAt: e.enrolledAt.toISOString(),
                        student: {
                          id: e.student.id,
                          admissionNo: e.student.admissionNo,
                          name: e.student.name,
                          guardianName: e.student.guardianName,
                          guardianPhone: e.student.guardianPhone,
                          status: e.student.status,
                        },
                      }));

                      return (
                        <div
                          key={batch.id}
                          className="border rounded-lg p-4 bg-white flex flex-col justify-between space-y-4 hover:border-slate-300 transition-colors shadow-1"
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <h4 className="font-semibold text-slate-900 text-base">
                                {batch.name}
                              </h4>
                              <Badge
                                variant={activeEnrollmentsCount >= cls.capacity ? "destructive" : "secondary"}
                                className="text-xs"
                              >
                                {activeEnrollmentsCount} / {cls.capacity} Enrolled
                              </Badge>
                            </div>

                            <div className="space-y-1.5 text-xs text-slate-600">
                              <div className="flex items-center">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                <span className="font-mono">{batch.timing}</span>
                              </div>

                              <div className="flex items-center">
                                <GraduationCap className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                <span>
                                  {batch.teacher ? (
                                    <strong className="text-slate-800 font-medium">
                                      {batch.teacher.user.name}
                                    </strong>
                                  ) : (
                                    <span className="text-amber-600 italic">No teacher assigned</span>
                                  )}
                                </span>
                              </div>

                              <div className="flex items-center">
                                <DollarSign className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
                                <span>{formatPKR(batch.feeMinor)} / month</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <AssignTeacherModal
                              batchId={batch.id}
                              batchName={batch.name}
                              currentTeacherId={batch.teacherId}
                              teachers={teachers}
                            />
                            <BatchRosterModal
                              batchName={batch.name}
                              className={`Class ${cls.name}-${cls.section}`}
                              capacity={cls.capacity}
                              enrollments={serializedEnrollments}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
