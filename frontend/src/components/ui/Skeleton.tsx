// src/components/ui/Skeleton.tsx
interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = "", style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-100 dark:bg-[#1c1c1e] ${className}`}
      style={style}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-surface shadow-sm">
      <div className="border-b border-gray-100 p-4 dark:border-[#38383a]">
        <div className="flex gap-3">
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-[#38383a]">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="flex gap-3 p-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <Skeleton key={colIdx} className="h-5 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-surface p-4 shadow-sm">
          <Skeleton className="mb-3 h-9 w-9 rounded-lg" />
          <Skeleton className="mb-1.5 h-3 w-20" />
          <Skeleton className="h-6 w-12" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 256 }: { height?: number }) {
  return (
    <div className="rounded-2xl bg-surface p-5 shadow-sm">
      <Skeleton className="mb-4 h-4 w-32" />
      <Skeleton className="w-full rounded-xl" style={{ height }} />
    </div>
  );
}