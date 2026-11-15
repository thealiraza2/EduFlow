export default function TeacherLoading() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border">
        <div className="space-y-2">
          <div className="h-8 w-44 bg-slate-200 rounded-md" />
          <div className="h-4 w-60 bg-slate-100 rounded-md" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-slate-200 rounded-md" />
          <div className="h-8 w-24 bg-slate-200 rounded-md" />
        </div>
      </div>

      <div className="h-64 bg-white border rounded-xl p-6 space-y-4">
        <div className="h-6 w-48 bg-slate-200 rounded" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-slate-50 border rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
