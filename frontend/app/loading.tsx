export default function Loading() {
  return (
    <div className="flex-1 p-6 space-y-6 animate-pulse">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-7 w-52 bg-slate-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-4 w-80 bg-slate-100 dark:bg-slate-800 rounded-lg" />
        </div>
        <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded-full" />
              <div className="size-8 bg-slate-100 dark:bg-slate-700 rounded-xl" />
            </div>
            <div className="h-6 w-28 bg-slate-200 dark:bg-slate-600 rounded-lg" />
            <div className="h-3 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
          </div>
        ))}
      </div>

      {/* Filter / search bar */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 p-4 flex gap-3">
        <div className="h-9 flex-1 bg-slate-100 dark:bg-slate-700 rounded-xl" />
        <div className="h-9 w-24 bg-slate-100 dark:bg-slate-700 rounded-xl" />
        <div className="h-9 w-24 bg-slate-100 dark:bg-slate-700 rounded-xl" />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 overflow-hidden">
        {/* Header row */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 flex gap-4">
          {[32, 20, 16, 14, 14].map((w, i) => (
            <div
              key={i}
              className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full"
              style={{ width: `${w}%` }}
            />
          ))}
        </div>
        {/* Data rows */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="px-4 py-3 border-b border-slate-50 dark:border-slate-700/30 last:border-0 flex items-center gap-4"
          >
            <div className="size-9 bg-slate-100 dark:bg-slate-700 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-600 rounded" />
              <div className="h-2.5 w-48 bg-slate-100 dark:bg-slate-700 rounded" />
            </div>
            <div className="h-5 w-16 bg-slate-100 dark:bg-slate-700 rounded-full" />
            <div className="h-3 w-20 bg-slate-100 dark:bg-slate-700 rounded" />
            <div className="size-8 bg-slate-100 dark:bg-slate-700 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
