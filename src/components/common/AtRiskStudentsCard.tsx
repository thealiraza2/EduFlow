import { StudentRiskMetrics } from "@/lib/risk";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  ShieldAlert,
  Brain,
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  Phone,
  BookOpen,
} from "lucide-react";

interface Props {
  students: StudentRiskMetrics[];
  title?: string;
  description?: string;
  isAiAvailable?: boolean;
}

export function AtRiskStudentsCard({
  students,
  title = "Student Retention & Dropout Risk",
  description = "Deterministic risk score computed from attendance (last 30d), fee dues, and marks trend.",
  isAiAvailable = false,
}: Props) {
  const highRiskCount = students.filter((s) => s.riskLevel === "HIGH").length;
  const mediumRiskCount = students.filter((s) => s.riskLevel === "MEDIUM").length;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="bg-gradient-to-r from-rose-50/60 via-amber-50/30 to-white border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-600 rounded-lg text-white shadow-sm">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <CardTitle className="text-base font-bold text-slate-900">{title}</CardTitle>
                <Badge
                  variant="outline"
                  className={
                    isAiAvailable
                      ? "bg-purple-50 text-purple-700 border-purple-200 text-[10px]"
                      : "bg-slate-100 text-slate-600 border-slate-200 text-[10px]"
                  }
                >
                  <Brain className="h-3 w-3 mr-1" />
                  {isAiAvailable ? "Groq LLM Active" : "AI insights unavailable — connect an AI key in Settings"}
                </Badge>
              </div>
              <CardDescription className="text-xs text-slate-500 mt-0.5">
                {description}
              </CardDescription>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-xs font-mono font-bold">
              {highRiskCount} High Risk
            </Badge>
            <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs font-mono font-bold">
              {mediumRiskCount} Medium
            </Badge>
            <span className="text-xs text-slate-400 font-mono">({students.length} Total)</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {students.length === 0 ? (
          <div className="p-10 text-center text-slate-400 text-sm">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            No active students flagged at risk. All attendance and fee metrics healthy!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[520px] overflow-y-auto">
            {students.map((st) => {
              const isHigh = st.riskLevel === "HIGH";
              const isMedium = st.riskLevel === "MEDIUM";

              return (
                <div
                  key={st.studentId}
                  className={`p-4 transition-colors hover:bg-slate-50/80 ${
                    isHigh ? "bg-rose-50/20" : isMedium ? "bg-amber-50/15" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Student Info */}
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm text-slate-900">{st.studentName}</span>
                        <span className="text-xs font-mono text-slate-400">({st.admissionNo})</span>
                        <Badge
                          className={`text-[10px] font-bold py-0.5 px-2 ${
                            isHigh
                              ? "bg-rose-600 text-white"
                              : isMedium
                              ? "bg-amber-500 text-white"
                              : "bg-emerald-600 text-white"
                          }`}
                        >
                          {st.riskLevel} RISK ({st.riskScore} pts)
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {st.batchName && <span>Batch: <strong>{st.batchName}</strong></span>}
                        {st.guardianPhone && (
                          <span className="inline-flex items-center text-slate-600 font-mono">
                            <Phone className="h-3 w-3 mr-1 text-slate-400" /> {st.guardianPhone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Risk Factor Badges */}
                    <div className="flex flex-wrap items-center gap-1.5 self-start">
                      {/* Attendance */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${
                          st.attendancePct < 60
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : st.attendancePct < 75
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        Att: {st.attendancePct}%
                      </span>

                      {/* Fee Overdue */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border ${
                          st.overdueMonths >= 2
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : st.overdueMonths === 1
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-slate-50 text-slate-700 border-slate-200"
                        }`}
                      >
                        {st.overdueMonths === 0
                          ? "Fees Clear"
                          : `${st.overdueMonths} mo overdue`}
                      </span>

                      {/* Marks Trend */}
                      <span
                        className={`text-[11px] px-2 py-0.5 rounded font-mono font-medium border inline-flex items-center ${
                          st.marksTrend === "DROPPING"
                            ? "bg-rose-50 text-rose-700 border-rose-200 font-bold"
                            : st.marksTrend === "RISING"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {st.marksTrend === "DROPPING" ? (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1 text-rose-600" /> Dropping
                          </>
                        ) : st.marksTrend === "RISING" ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1 text-emerald-600" /> Rising
                          </>
                        ) : (
                          <>
                            <Minus className="h-3 w-3 mr-1 text-slate-400" /> Stable
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Plain Language Explanation (Urdu-English) */}
                  <div className="mt-2.5 p-2 rounded bg-white border border-slate-150 text-xs text-slate-700 flex items-start space-x-2">
                    <Sparkles className="h-3.5 w-3.5 mt-0.5 text-indigo-500 shrink-0" />
                    <span className="font-medium">{st.explanation}</span>
                  </div>

                  {/* Weak Subject & Recommended Topics */}
                  {st.weakSubject && (
                    <div className="mt-2 p-2 rounded bg-amber-50/50 border border-amber-200/60 text-xs text-slate-800 flex items-start space-x-2">
                      <BookOpen className="h-3.5 w-3.5 mt-0.5 text-amber-600 shrink-0" />
                      <div>
                        <span>
                          Academic Weakness:{" "}
                          <strong className="text-amber-900">{st.weakSubject.subject}</strong> (
                          {st.weakSubject.averagePercentage}% average).
                        </span>
                        {st.weakSubject.suggestedTopics.length > 0 && (
                          <div className="text-[11px] text-slate-600 mt-0.5">
                            Target topics:{" "}
                            <span className="font-medium text-slate-800">
                              {st.weakSubject.suggestedTopics.join(" • ")}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
