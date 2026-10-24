import { ShieldAlert, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface DemoBannerProps {
  className?: string
  variant?: "prominent" | "compact" | "notice"
}

/**
 * Conspicuous banner notifying users that the system is operating in safe Demo Mode.
 * Ensures zero ambiguity that no real account or credentials are saved.
 */
export function DemoBanner({ className, variant = "prominent" }: DemoBannerProps) {
  if (variant === "compact") {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
          className,
        )}
      >
        <Info aria-hidden className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
        <span className="font-semibold">Demo Mode — no real account is created.</span>
      </div>
    )
  }

  return (
    <div
      role="region"
      aria-label="Demo Mode Notice"
      className={cn(
        "relative overflow-hidden rounded-xl border border-amber-200/80 bg-amber-50/70 p-4 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-amber-200/60 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
          <ShieldAlert aria-hidden className="size-4" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-200">
            Demo Mode — no real account is created
          </p>
          <p className="mt-1 text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
            SuwaDaru is running in client demonstration mode. No real passwords, email
            addresses, or medical records are transmitted or persisted. Any fictional
            information entered stays local.
          </p>
        </div>
      </div>
    </div>
  )
}
