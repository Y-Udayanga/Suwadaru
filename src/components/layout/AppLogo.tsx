import { Leaf } from "lucide-react"
import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"

/**
 * AppLogo — brand mark for SuwaDaru.
 *
 * Props:
 *   collapsed?: boolean   — icon-only mode for narrow sidebar (default false)
 *   asLink?:    boolean   — wraps in a Link to "/" (default true)
 *   className?: string    — forwarded to the root element
 *
 * Always renders the Leaf icon + full name. In collapsed=true mode it hides
 * the text visually but keeps it accessible via aria-label on the wrapping
 * anchor so screen readers still announce the brand.
 */

interface AppLogoProps {
  collapsed?: boolean
  asLink?: boolean
  className?: string
}

function LogoContent({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      {/* Leaf icon with teal gradient background */}
      <span
        aria-hidden="true"
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl",
          "bg-gradient-to-br from-[#0F766E] to-[#0d6560]",
          "shadow-sm",
        )}
      >
        <Leaf className="size-5 text-white" strokeWidth={2.5} />
      </span>

      {/* Brand text — visually hidden when collapsed */}
      <span
        className={cn(
          "flex min-w-0 flex-col leading-none",
          collapsed && "sr-only",
        )}
      >
        <span className="text-base font-bold tracking-tight text-foreground">
          SuwaDaru
        </span>
        <span className="mt-0.5 truncate text-[0.65rem] font-medium tracking-wide text-muted-foreground uppercase">
          Every Child. Every Milestone.
        </span>
      </span>
    </>
  )
}

export function AppLogo({
  collapsed = false,
  asLink = true,
  className,
}: AppLogoProps) {
  const inner = <LogoContent collapsed={collapsed} />

  if (asLink) {
    return (
      <Link
        to={routes.home}
        aria-label="SuwaDaru — go to home"
        className={cn(
          "inline-flex items-center gap-3 rounded-lg",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          collapsed && "justify-center",
          className,
        )}
      >
        {inner}
      </Link>
    )
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-3",
        collapsed && "justify-center",
        className,
      )}
    >
      {inner}
    </div>
  )
}
