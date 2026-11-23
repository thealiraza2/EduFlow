"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/money";
import { ParentChildSummary } from "@/lib/parent";
import { DAYS_OF_WEEK } from "@/lib/constants";
import { PayInvoiceButton } from "@/components/parent/PayInvoiceButton";
import { CountUp } from "@/components/common/CountUp";
import {
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Download,
  School,
  FileSpreadsheet,
  Banknote,
  Award,
  BookOpen,
  MapPin,
} from "lucide-react";

interface Props {
  child: ParentChildSummary;
}

export function ParentChildCard({ child }: Props) {
  const searchParams = useSearchParams();
  const paymentParam = searchParams?.get("payment");
  const [activeTab, setActiveTab] = useState<"attendance" | "fees" | "results" | "timetable">(
    paymentParam ? "fees" : "attendance"
  );

  const displayDays = DAYS_OF_WEEK.filter((d) => d.id >= 1 && d.id <= 6);

  return (
    <div className="space-y-6">
      {/* Child Overview Bar */}
      <div className="bg-white p-5 rounded-xl border shadow-1 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-semibold text-slate-900">{child.student.name}</h2>
            <Badge variant="outline" className="font-mono text-xs">
              {child.student.admissionNo}
            </Badge>
            <Badge
              variant={child.student.status === "ACTIVE" ? "default" : "secondary"}
              className="text-xs"
            >
              {child.student.status}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Guardian: {child.student.guardianName} • {child.student.guardianPhone}
          </p>
        </div>

        {/* Quick KPI badges */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center min-w-[100px] shadow-xs">
            <span className="text-xs uppercase text-slate-500 font-semibold block tracking-wider">Attendance</span>
            <span className="font-semibold font-mono text-emerald-600 text-sm mt-0.5 block">
              {child.attendance.totalSessions === 0 ? (
                "No sessions recorded"
              ) : (
                <CountUp value={child.attendance.percentage ?? 0} suffix="%" />
              )}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl text-center min-w-[100px] shadow-xs">
            <span className="text-xs uppercase text-slate-500 font-semibold block tracking-wider">Fee Dues</span>
            <span
              className={`font-semibold font-mono text-sm mt-0.5 block ${
                child.fees.totalOutstandingMinor > 0 ? "text-rose-600" : "text-emerald-600"
              }`}
            >
              <CountUp value={child.fees.totalOutstandingMinor / 100} prefix="PKR " />
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto bg-white rounded-t-xl px-2">
        <button
          onClick={() => setActiveTab("attendance")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === "attendance"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Calendar className="h-3.5 w-3.5" />
          <span>Attendance ({child.attendance.monthStr})</span>
        </button>

        <button
          onClick={() => setActiveTab("fees")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === "fees"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Banknote className="h-3.5 w-3.5" />
          <span>Fee Status & Challans</span>
          {child.fees.totalOutstandingMinor > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs py-0 px-1">
              Due
            </Badge>
          )}
        </button>

        <button
          onClick={() => setActiveTab("results")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === "results"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Award className="h-3.5 w-3.5" />
          <span>Published Results ({child.results.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("timetable")}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center space-x-1.5 whitespace-nowrap ${
            activeTab === "timetable"
              ? "border-slate-900 text-slate-900"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <Clock className="h-3.5 w-3.5" />
          <span>Weekly Timetable</span>
        </button>
      </div>

      {/* Tab 1: Attendance */}
      {activeTab === "attendance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3 rounded-lg border text-center">
              <span className="text-xs text-slate-400 font-semibold uppercase block">Monthly %</span>
              <span className="text-xl font-semibold font-mono text-emerald-600">
                {child.attendance.totalSessions === 0 ? "No sessions recorded" : `${child.attendance.percentage}%`}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <span className="text-xs text-emerald-600 font-semibold uppercase block">Present</span>
              <span className="text-xl font-semibold font-mono text-emerald-700">
                {child.attendance.presentCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <span className="text-xs text-rose-600 font-semibold uppercase block">Absent</span>
              <span className="text-xl font-semibold font-mono text-rose-700">
                {child.attendance.absentCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <span className="text-xs text-amber-600 font-semibold uppercase block">Leave</span>
              <span className="text-xl font-semibold font-mono text-amber-700">
                {child.attendance.leaveCount}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border text-center">
              <span className="text-xs text-sky-600 font-semibold uppercase block">Late</span>
              <span className="text-xl font-semibold font-mono text-sky-700">
                {child.attendance.lateCount}
              </span>
            </div>
          </div>

          <Card className="shadow-1 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b bg-slate-50">
              <CardTitle className="text-sm font-semibold text-slate-900">
                Attendance Records — {child.attendance.monthStr}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {child.attendance.records.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No attendance records marked yet for this month.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {child.attendance.records.map((rec) => (
                    <div
                      key={rec.id}
                      className="py-3 px-5 flex items-center justify-between text-xs hover:bg-slate-50/60"
                    >
                      <div>
                        <span className="font-semibold text-slate-900 font-mono">{rec.date}</span>
                        <span className="text-slate-500 ml-2">({rec.batchName})</span>
                        {rec.remarks && (
                          <span className="text-slate-400 italic ml-2">• "{rec.remarks}"</span>
                        )}
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs uppercase font-semibold py-0.5 px-2 ${
                          rec.status === "PRESENT"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : rec.status === "ABSENT"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : rec.status === "LEAVE"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {rec.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 2: Fees & Challans */}
      {activeTab === "fees" && (
        <div className="space-y-4">
          <Card className="shadow-1 overflow-hidden">
            <CardHeader className="py-3 px-5 border-b bg-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold text-slate-900">
                  Monthly Fee Invoices & Payment Status
                </CardTitle>
                <CardDescription className="text-xs">
                  Download official fee challans and review payment receipts.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {child.fees.invoices.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No invoices generated yet for this student.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {child.fees.invoices.map((inv) => (
                    <div key={inv.id} className="p-4 space-y-3 hover:bg-slate-50/40">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold text-slate-900 text-sm">
                              Month: {inv.month}
                            </span>
                            <Badge
                              variant={
                                inv.status === "PAID"
                                  ? "default"
                                  : inv.status === "PARTIAL"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className={`text-xs uppercase font-semibold py-0.5 px-2 ${
                                inv.status === "PAID"
                                  ? "bg-emerald-600 text-white"
                                  : inv.status === "PARTIAL"
                                  ? "bg-amber-100 text-amber-800 border-amber-300"
                                  : "bg-rose-100 text-rose-800 border-rose-200"
                              }`}
                            >
                              {inv.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Batch: {inv.batchName}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 text-xs">
                          <div className="text-right">
                            <div className="text-slate-500">
                              Total: <strong>{formatPKR(inv.totalMinor)}</strong> | Paid:{" "}
                              <span className="text-emerald-600 font-semibold">
                                {formatPKR(inv.paidMinor)}
                              </span>
                            </div>
                            <div
                              className={`font-semibold font-mono text-sm ${
                                inv.remainingMinor > 0 ? "text-rose-600" : "text-emerald-600"
                              }`}
                            >
                              Due: {formatPKR(inv.remainingMinor)}
                            </div>
                          </div>

                          {/* Pay Now Button (if unpaid or partial) */}
                          {inv.remainingMinor > 0 && inv.status !== "PAID" && (
                            <PayInvoiceButton
                              invoiceId={inv.id}
                              remainingMinor={inv.remainingMinor}
                            />
                          )}

                          {/* Challan PDF Download */}
                          <a
                            href={`/api/invoices/${inv.id}/challan`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-1"
                          >
                            <Download className="h-3.5 w-3.5 mr-1" />
                            Challan
                          </a>
                        </div>
                      </div>

                      {/* Payment History breakdown */}
                      {inv.payments.length > 0 && (
                        <div className="bg-slate-50 rounded-lg p-2.5 border text-xs text-slate-600 space-y-1">
                          <span className="font-semibold text-slate-700 block">Payment Receipts:</span>
                          {inv.payments.map((p) => (
                            <div key={p.id} className="flex justify-between items-center font-mono">
                              <span className="flex items-center space-x-1.5 flex-wrap">
                                <span>{p.paidAt.split("T")[0]} •</span>
                                {p.gatewayTransactionId ? (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                                    {p.method} Gateway ({p.gatewayTransactionId.slice(-8)})
                                  </span>
                                ) : (
                                  <span>via {p.method} (Manual: {p.receivedBy})</span>
                                )}
                              </span>
                              <span className="font-semibold text-emerald-700">
                                +{formatPKR(p.amountMinor)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab 3: Published Results */}
      {activeTab === "results" && (
        <Card className="shadow-1 overflow-hidden">
          <CardHeader className="py-3 px-5 border-b bg-slate-50">
            <CardTitle className="text-sm font-semibold text-slate-900">
              Published Assessment Results & Result Cards
            </CardTitle>
            <CardDescription className="text-xs">
              Official faculty assessment reports approved by administration.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {child.results.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No published test results available yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {child.results.map((res) => (
                  <div
                    key={res.testId}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/40"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-slate-900 text-sm">{res.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {res.subject}
                        </Badge>
                      </div>
                      <div className="text-xs text-slate-500 mt-1">
                        Date: {res.testDate} • Class Rank:{" "}
                        <strong className="text-slate-800">{res.classPosition}</strong>
                      </div>
                      {res.remarks && (
                        <div className="text-xs text-slate-600 mt-1 italic">
                          Faculty Feedback: "{res.remarks}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-mono font-semibold text-sm text-slate-900">
                          {res.obtainedMarks} / {res.totalMarks} ({res.percentage}%)
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs font-mono font-semibold py-0.5 px-2 mt-0.5 ${
                            res.grade === "A+" || res.grade === "A"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : res.grade === "F"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          Grade {res.grade}
                        </Badge>
                      </div>

                      {/* Result Card PDF Download */}
                      <a
                        href={`/api/tests/${res.testId}/results/${child.student.id}/card`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-1"
                        title="Download Official Result Card PDF"
                      >
                        <Download className="h-3.5 w-3.5 mr-1" />
                        Result Card
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Tab 4: Weekly Timetable */}
      {activeTab === "timetable" && (
        <div className="space-y-4">
          {child.enrollments.map((enr) => (
            <Card key={enr.id} className="shadow-1 overflow-hidden border">
              <CardHeader className="bg-slate-900 text-white py-3 px-5">
                <CardTitle className="text-sm font-semibold text-white flex items-center">
                  <School className="h-4 w-4 mr-2 text-blue-400" />
                  {enr.batchName} Schedule ({enr.timing})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {enr.timetableSlots.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    No scheduled timetable slots for this batch yet.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {displayDays.map((day) => {
                      const daySlots = enr.timetableSlots.filter((s) => s.dayOfWeek === day.id);
                      return (
                        <div
                          key={day.id}
                          className="bg-slate-50 border rounded-lg p-2.5 space-y-2 flex flex-col justify-between"
                        >
                          <div className="border-b border-slate-200 pb-1">
                            <span className="font-semibold text-slate-900 text-xs">{day.name}</span>
                          </div>

                          <div className="space-y-1.5 flex-1">
                            {daySlots.length === 0 ? (
                              <span className="text-xs text-slate-400 italic block py-2">
                                No classes
                              </span>
                            ) : (
                              daySlots.map((slot) => (
                                <div
                                  key={slot.id}
                                  className="bg-white border rounded p-1.5 shadow-xs text-xs"
                                >
                                  <div className="font-semibold text-slate-800">{slot.subject}</div>
                                  <div className="text-slate-500 font-mono text-xs flex items-center mt-0.5">
                                    <Clock className="h-2.5 w-2.5 mr-0.5" />
                                    {slot.startTime}–{slot.endTime}
                                  </div>
                                  <div className="text-slate-600 mt-0.5 truncate text-xs">
                                    {slot.teacherName}
                                  </div>
                                </div>
                              ))
                            )}
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
