import clsx from 'clsx'

export function Skeleton({ className, ...props }) {
  return <div className={clsx('skeleton', className)} {...props} />
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50/80 px-4 py-3">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-4 px-4 py-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-4 h-5 w-32" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className="mb-2 h-4 w-full last:mb-0" />
      ))}
    </div>
  )
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-3 h-8 w-16" />
      <Skeleton className="h-3 w-24" />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div>
        <Skeleton className="mb-4 h-5 w-24" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
      <div>
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}
