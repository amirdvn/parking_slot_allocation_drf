interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-border/60 dark:bg-border/40 ${className}`}
    />
  );
}

// اسکلتون برای جدول
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="border-b border-border bg-background p-4">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-4 p-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// اسکلتون برای کارت‌های آماری داشبورد
export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-border bg-surface p-4 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// اسکلتون برای نمودارها
export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <Skeleton className="mb-4 h-5 w-40" />
      <Skeleton className="w-full rounded-lg" style={{ height } as any} />
    </div>
  );
}