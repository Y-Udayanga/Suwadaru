import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * EmptyState
 *
 * Shown when a feature has no data yet (e.g., no growth measurements, no
 * children registered). Provides a clear CTA and a non-alarmist message.
 *
 * Props:
 *   icon?:       ReactNode — Lucide icon rendered large and decorative
 *   title:       string   — primary message ("No children yet")
 *   description: string   — explanatory secondary text
 *   action?:     ReactNode — primary CTA (usually a Button)
 *   className?:  string
 *
 * Example (Frontend B vaccinations):
 *
 *   <EmptyState
 *     icon={<Syringe />}
 *     title="No vaccination records"
 *     description="Add a parent-reported vaccination date, or check back after a clinic visit."
 *     action={<Button size="sm">Add record</Button>}
 *   />
 */
interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
        className,
      )}
    >
      {icon && (
        <span
          aria-hidden="true"
          className="flex size-14 items-center justify-center rounded-full bg-muted [&>svg]:size-7 [&>svg]:text-muted-foreground"
        >
          {icon}
        </span>
      )}

      <div className="max-w-xs">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

// ---------------------------------------------------------------------------
// ErrorState
// ---------------------------------------------------------------------------

/**
 * ErrorState
 *
 * Shown when a service call fails or an unexpected error occurs.
 * Always provides a retry or return action — never a blank screen.
 * Does not claim a clinical interpretation of the error.
 *
 * Props:
 *   title?:      string   — default "Something went wrong"
 *   description?: string  — default generic message
 *   action?:     ReactNode — retry button or Back link
 *   className?:  string
 *
 * Example:
 *
 *   <ErrorState
 *     description="Could not load growth measurements. Check your connection and try again."
 *     action={<Button variant="outline" onClick={retry}>Try again</Button>}
 *   />
 */
interface ErrorStateProps {
  title?: string
  description?: string
  action?: ReactNode
  className?: string
}

export function ErrorState({
  title = "Something went wrong",
  description = "We could not load this section. Please try again.",
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[#E27D72]/40 bg-[#E27D72]/5 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full bg-[#E27D72]/10"
      >
        <svg
          className="size-7 text-[#c0392b]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </span>

      <div className="max-w-xs">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
