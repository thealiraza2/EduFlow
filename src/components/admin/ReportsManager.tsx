"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  School,
  Banknote,
  CheckCircle2,
  Award,
  GraduationCap,
  Info,
} from "lucide-react";

interface BatchItem {
  id: string;
  name: string;
  className: string;
}

interface Props {
  batches: BatchItem[];
  initialMonth: string;
}

export function ReportsManager({ batches, initialMonth }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");

  const getDownloadUrl = (type: string) => {
    const params = new URLSearchParams();
    params.set("type", type);
    if (type === "fees" || type === "attendance") {
      params.set("month", selectedMonth);
    }
    if (selectedBatchId && (type === "attendance" || type === "performance")) {
      params.set("batchId", selectedBatchId);
    }
    return `/api/admin/reports?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* Information Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-1">
        <div>
          <h2 className="text-lg font-semibold flex items-center">
            <FileSpreadsheet className="h-5 w-5 mr-2 text-emerald-400" />
            Academy Audit & Operational Reports
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Export comprehensive comma-separated value (CSV) reports compatible with Microsoft Excel, Google Sheets, and accounting software.
          </p>
        </div>
      </div>

      {/* Global Filter Bar */}
      <Card className="shadow-1">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block">
                  Report Month
                </label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-9 w-40 text-sm mt-0.5"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <School className="h-4 w-4 text-slate-500" />
              <div>
                <label className="text-xs font-semibold uppercase text-slate-500 block">
                  Filter by Batch (Optional)
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="h-9 px-3 py-1 rounded-md border border-slate-200 bg-white text-sm mt-0.5 focus:outline-hidden focus:ring-2 focus:ring-slate-950"
                >
                  <option value="">All Batches & Classes</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.className} - {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="text-xs text-slate-500 flex items-center">
            <Info className="h-4 w-4 mr-1.5 text-slate-400" />
            <span>Targeting: <strong>{selectedMonth}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* 4 Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Fee Collection Report */}
        <Card className="shadow-1 hover:shadow-2 transition-shadow flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <Banknote className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                Financial Audit
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-900 mt-3">
              Monthly Fee Collection Report
            </CardTitle>
            <CardDescription className="text-xs">
              Complete breakdown of tuition invoices, late fines, student discounts, paid amounts, remaining dues, and payment timestamps.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border">
              <strong>Includes:</strong> Invoice ID, Student Name, Admission No, Class/Batch, Tuition Fee, Late Fine, Discount, Total Due, Paid, Balance, Status, Paid Date.
            </div>
            <a
              href={getDownloadUrl("fees")}
              download
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Fee Report ({selectedMonth})
            </a>
          </CardContent>
        </Card>

        {/* 2. Batch Attendance Report */}
        <Card className="shadow-1 hover:shadow-2 transition-shadow flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-lg">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                Student Regularity
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-900 mt-3">
              Batch Attendance Report
            </CardTitle>
            <CardDescription className="text-xs">
              Monthly attendance performance per student across batches, with aggregate counts for Present, Absent, Leave, Late, and overall attendance percentage.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border">
              <strong>Includes:</strong> Student Name, Admission No, Batch, Total Sessions Held, Present Count, Absent Count, Leaves, Lates, Calculated Attendance %.
            </div>
            <a
              href={getDownloadUrl("attendance")}
              download
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Attendance Report ({selectedMonth})
            </a>
          </CardContent>
        </Card>

        {/* 3. Student Performance Report */}
        <Card className="shadow-1 hover:shadow-2 transition-shadow flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-purple-100 text-purple-800 rounded-lg">
                <Award className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                Academic Results
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-900 mt-3">
              Student Performance & Test Results
            </CardTitle>
            <CardDescription className="text-xs">
              All published evaluation test marks, obtained percentages, letter grades (A+ to F), and instructor remarks across enrolled batches.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border">
              <strong>Includes:</strong> Class, Batch, Student Name, Admission No, Test Title, Subject, Test Date, Total Marks, Obtained Marks, Percentage, Grade, Remarks.
            </div>
            <a
              href={getDownloadUrl("performance")}
              download
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Academic Performance Report
            </a>
          </CardContent>
        </Card>

        {/* 4. Teacher Workload & Payroll Report */}
        <Card className="shadow-1 hover:shadow-2 transition-shadow flex flex-col justify-between">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-amber-100 text-amber-800 rounded-lg">
                <GraduationCap className="h-6 w-6" />
              </div>
              <span className="text-xs font-mono uppercase bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-semibold">
                Faculty & Workload
              </span>
            </div>
            <CardTitle className="text-base font-semibold text-slate-900 mt-3">
              Teacher Workload & Payroll Roster
            </CardTitle>
            <CardDescription className="text-xs">
              Complete faculty roster with base monthly contracts, teaching subjects, assigned class batches, weekly lecture slots, and calculated weekly teaching hours.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded border">
              <strong>Includes:</strong> Teacher Name, Contact Email/Phone, Base Salary, Status, Subjects, Assigned Batches, Weekly Lecture Slots, Total Weekly Hours.
            </div>
            <a
              href={getDownloadUrl("teachers")}
              download
              className="inline-flex items-center justify-center w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-medium transition-colors shadow-xs"
            >
              <Download className="h-4 w-4 mr-1.5" />
              Download Faculty Workload Report
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
