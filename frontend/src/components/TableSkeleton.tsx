export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-2 p-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-8 rounded-lg bg-secondary animate-pulse"
              style={{ flex: j === 1 ? 2 : 1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="h-4 w-24 bg-secondary rounded animate-pulse" />
      <div className="h-8 w-32 bg-secondary rounded animate-pulse" />
      <div className="h-3 w-20 bg-secondary rounded animate-pulse" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-5 space-y-5">
      <div className="h-7 w-48 bg-secondary rounded animate-pulse" />
      <div className="grid grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
      </div>
      <div className="bg-card border border-border rounded-xl">
        <div className="p-4 border-b border-border">
          <div className="h-5 w-40 bg-secondary rounded animate-pulse" />
        </div>
        <TableSkeleton />
      </div>
    </div>
  );
}
