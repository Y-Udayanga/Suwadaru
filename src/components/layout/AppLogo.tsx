import { Link } from "react-router"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import logoImg from "@/assets/logo.jpg"

/**
 * AppLogo — brand mark for SuwaDaru.
 *
 * Props:
 *   collapsed?: boolean   — icon-only mode for narrow sidebar (default false)
 *   asLink?:    boolean   — wraps in a Link to "/" (default true)
 *   size?:      "sm" | "md" | "lg" — size variation
 *   className?: string    — forwarded to the root element
 *
 * Renders the SuwaDaru mother-child heart emblem + full brand name.
 * In collapsed=true mode it hides the text visually but keeps it accessible
 * via aria-label on the wrapping anchor so screen readers still announce the brand.
 */

interface AppLogoProps {
  collapsed?: boolean
  asLink?: boolean
  size?: "sm" | "md" | "lg"
  className?: string
}

function LogoContent({
  collapsed,
  size = "md",
}: {
  collapsed: boolean
  size?: "sm" | "md" | "lg"
}) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-9 sm:size-10",
    lg: "size-12",
  }[size]

  return (
    <>
      {/* Mother & Child Emblem */}
      <span
        aria-hidden="true"
        className={cn(
          "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl",
          "ring-2 ring-primary/20 bg-white shadow-[0_4px_12px_rgba(225,29,72,0.12)]",
          "transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_6px_20px_rgba(225,29,72,0.22)] group-hover:ring-primary/40",
          sizeClasses,
        )}
      >
        <img
          src={logoImg}
          alt="SuwaDaru Caregiver and Child"
          className="size-full object-cover"
          loading="eager"
        />
      </span>

      {/* Brand text — visually hidden when collapsed */}
      <span
        className={cn(
          "flex min-w-0 flex-col leading-none",
          collapsed && "sr-only",
        )}
      >
        <span className="text-base font-extrabold tracking-tight bg-gradient-to-r from-rose-700 via-rose-600 to-amber-600 bg-clip-text text-transparent dark:from-rose-300 dark:via-rose-200 dark:to-amber-200">
          SuwaDaru
        </span>
        <span className="mt-0.5 truncate text-[0.65rem] font-semibold tracking-wider text-muted-foreground uppercase">
          Every Child. Every Milestone.
        </span>
      </span>

    </>
  )
}

export function AppLogo({
  collapsed = false,
  asLink = true,
  size = "md",
  className,
}: AppLogoProps) {
  const inner = <LogoContent collapsed={collapsed} size={size} />

  if (asLink) {
    return (
      <Link
        to={routes.home}
        aria-label="SuwaDaru — go to home"
        className={cn(
          "group inline-flex items-center gap-3 rounded-lg",
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
        "group inline-flex items-center gap-3",
        collapsed && "justify-center",
        className,
      )}
    >
      {inner}
    </div>
  )
}

