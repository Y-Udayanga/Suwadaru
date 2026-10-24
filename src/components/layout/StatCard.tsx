import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

/**
 * StatCard
 *
 * A metric summary tile used on the dashboard and child overview screens.
 * Neutral by design — no green "healthy" or red "danger" default coloring.
 * Color must be provided by the caller only when there is evidence-backed text.
 *
 * Props:
 *   label:      string   — short metric name (e.g. "Next vaccination")
 *   value:      ReactNode — primary displayed value or "—" when unavailable
 *   detail?:    string   — secondary supporting line
 *   icon?:      ReactNode — Lucide icon (aria-hidden, decorative)
 *   accent?:    "teal" | "gold" | "coral" | "neutral"
 *               — optional color accent on the icon area (default "neutral")
 *   className?: string   — forwarded to root
 *
 * Accessibility: the card is an `<article>` landmark so screen readers
 * announce it. The icon is aria-hidden.
 *
 * Example (Frontend A dashboard):
 *
 *   <StatCard
 *     label="Next vaccination"
 *     value="Pentavalent 2"
 *     detail="Due 15 Dec 2025"
 *     icon={<Syringe />}
 *     accent="teal"
 *   />
 */
export type StatCardAccent = "teal" | "gold" | "coral" | "neutral"

interface StatCardProps {
  label: string
  value: ReactNode
  detail?: string
  icon?: ReactNode
  accent?: StatCardAccent
  className?: string
}

const accentClasses: Record<StatCardAccent, string> = {
  teal: "bg-primary/10 text-primary",
  gold: "bg-[#F4C95D]/20 text-[#a07a00]",
  coral: "bg-[#E27D72]/10 text-[#c0392b]",
  neutral: "bg-muted text-muted-foreground",
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  accent = "neutral",
  className,
}: StatCardProps) {
  return (
    <article
      className={cn(
        "glass-card interactive-card flex min-w-0 flex-col gap-3 rounded-2xl p-4.5 shadow-xs",
        className,
      )}
    >

      <div className="flex items-center gap-3">
        {icon && (
          <span
            aria-hidden="true"
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              "[&>svg]:size-4",
              accentClasses[accent],
            )}
          >
            {icon}
          </span>
        )}
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {label}
        </p>
      </div>

      <div className="min-w-0">
        <div className="text-xl font-bold tracking-tight text-foreground text-balance">
          {value}
        </div>
        {detail && (
          <p className="mt-0.5 text-sm text-muted-foreground">{detail}</p>
        )}
      </div>
    </article>
  )
}
