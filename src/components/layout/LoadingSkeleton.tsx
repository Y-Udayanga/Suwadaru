import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * LoadingSkeleton
 *
 * A composable loading placeholder that mirrors common page layout patterns.
 * Use in Suspense boundaries or while async data resolves.
 *
 * Props:
 *   variant?:  "page" | "card" | "list" | "chart"
 *              — preset skeleton layout (default "page")
 *   rows?:     number — for "list" variant, number of skeleton rows (default 4)
 *   className?: string
 *
 * Example (Frontend B — growth chart loading):
 *
 *   <LoadingSkeleton variant="chart" />
 *
 * Example (Frontend B — appointment list loading):
 *
 *   <LoadingSkeleton variant="list" rows={5} />
 */
interface LoadingSkeletonProps {
  variant?: "page" | "card" | "list" | "chart"
  rows?: number
  className?: string
}

export function LoadingSkeleton({
  variant = "page",
  rows = 4,
  className,
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div
        aria-label="Loading…"
        aria-busy="true"
        className={cn(
          "flex flex-col gap-3 rounded-xl border border-border bg-card p-4",
          className,
        )}
      >
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-lg" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-24" />
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div
        aria-label="Loading…"
        aria-busy="true"
        className={cn("flex flex-col gap-2", className)}
      >
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows are positional
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
            <Skeleton className="size-8 shrink-0 rounded-full" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-3.5 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "chart") {
    return (
      <div
        aria-label="Loading chart…"
        aria-busy="true"
        className={cn(
          "flex flex-col gap-4 rounded-xl border border-border bg-card p-4",
          className,
        )}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-64 w-full rounded-lg" />
        <div className="flex gap-4">
          {[1, 2, 3].map((k) => (
            <Skeleton key={k} className="h-3 w-16" />
          ))}
        </div>
      </div>
    )
  }

  // Default: "page" — header + two stat cards + content block
  return (
    <div
      aria-label="Loading page…"
      aria-busy="true"
      className={cn("flex flex-col gap-6", className)}
    >
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <Skeleton className="h-7 w-56" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Stat cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((k) => (
          <LoadingSkeleton key={k} variant="card" />
        ))}
      </div>

      {/* Main content area */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    </div>
  )
}
