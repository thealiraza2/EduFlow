export default function SuperAdminLoading() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-slate-200 rounded-md" />
          <div className="h-4 w-72 bg-slate-100 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-28 bg-white border rounded-xl p-4 space-y-3">
            <div className="h-4 w-20 bg-slate-200 rounded" />
            <div className="h-7 w-16 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      <div className="h-72 bg-white border rounded-xl p-6" />
    </div>
  );
}
