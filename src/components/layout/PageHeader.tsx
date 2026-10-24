import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * PageHeader
 *
 * Standard page-level heading block. Used at the top of every authenticated
 * page. Renders a semantic `<header>` landmark with an `<h1>` title, optional
 * subtitle, and an optional trailing `actions` slot.
 *
 * Props:
 *   title:     string   — visible <h1> for the page
 *   subtitle?: string   — short supporting text (appears below title)
 *   actions?:  ReactNode — buttons/links placed in the trailing slot
 *   className?: string  — forwarded to the root element
 *
 * Example (Frontend B):
 *
 *   <PageHeader
 *     title="Vaccination Schedule"
 *     subtitle="Nethmi · 18 months"
 *     actions={<Button size="sm">Add record</Button>}
 *   />
 */
interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex min-w-0 flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground text-balance">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
