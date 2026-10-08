export default function ListPageSkeleton() {
    return (
      <div className="w-full p-4 md:p-6 flex flex-col gap-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <div className="h-7 w-48 rounded-lg bg-slate-200" />
            <div className="h-4 w-72 max-w-full rounded-md bg-slate-100" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-44 rounded-lg bg-slate-200" />
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-8 w-8 rounded-full bg-slate-200" />
            <div className="h-8 w-8 rounded-full bg-slate-200" />
          </div>
        </div>
  
        {/* Table card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          {/* Table head */}
          <div className="flex gap-4 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            {[40, 24, 28, 20, 16].map((w, i) => (
              <div
                key={i}
                className="h-3 rounded bg-slate-200"
                style={{ width: `${w}%`, maxWidth: 120 }}
              />
            ))}
          </div>
  
          {/* Rows */}
          <div className="divide-y divide-slate-100">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-1/3 rounded bg-slate-200" />
                  <div className="h-3 w-1/4 rounded bg-slate-100" />
                </div>
                <div className="hidden h-3 w-20 rounded bg-slate-100 sm:block" />
                <div className="hidden h-3 w-24 rounded bg-slate-100 md:block" />
                <div className="flex gap-2">
                  <div className="h-7 w-7 rounded-full bg-slate-200" />
                  <div className="h-7 w-7 rounded-full bg-slate-200" />
                </div>
              </div>
            ))}
          </div>
  
          {/* Pagination footer */}
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-9 w-16 rounded-lg bg-slate-100" />
              <div className="h-9 w-9 rounded-lg bg-slate-200" />
              <div className="h-9 w-16 rounded-lg bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }