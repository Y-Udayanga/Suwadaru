import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  variant?: "pill" | "icon"
}

export function ThemeToggle({ className, variant = "pill" }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      title={
        isDark ? "Switch to light mode" : "Switch to dark mode"
      }
      className={cn(
        "group relative inline-flex items-center justify-center cursor-pointer select-none",
        "rounded-full transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        variant === "pill"
          ? "h-9 px-3 gap-2 border border-border/80 bg-card/80 hover:bg-accent/80 hover:border-accent-foreground/30 shadow-2xs backdrop-blur-sm"
          : "size-9 border border-border/80 bg-card/80 hover:bg-accent/80 hover:border-accent-foreground/30 shadow-2xs backdrop-blur-sm",
        className,
      )}
    >
      {/* Icon with smooth rotate/scale transitions */}
      <span className="relative size-4.5 flex items-center justify-center">
        {/* Sun Icon (visible in light mode) */}
        <Sun
          aria-hidden
          className={cn(
            "size-4 text-amber-500 transition-all duration-300",
            isDark
              ? "rotate-90 scale-0 opacity-0 absolute"
              : "rotate-0 scale-100 opacity-100 fill-amber-400/20",
          )}
        />
        {/* Moon Icon (visible in dark mode) */}
        <Moon
          aria-hidden
          className={cn(
            "size-4 text-rose-300 transition-all duration-300",
            isDark
              ? "rotate-0 scale-100 opacity-100 fill-rose-400/20"
              : "-rotate-90 scale-0 opacity-0 absolute",
          )}
        />
      </span>

      {/* Text label for pill variant */}
      {variant === "pill" && (
        <span className="text-xs font-semibold tracking-tight transition-colors">
          {isDark ? (
            <span className="text-rose-200 group-hover:text-rose-100">Dark</span>
          ) : (
            <span className="text-amber-800/90 group-hover:text-amber-900">Light</span>
          )}
        </span>
      )}

      {/* Subtle indicator aura glow */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 -z-10 rounded-full blur-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          isDark
            ? "bg-rose-500/20"
            : "bg-amber-400/25",
        )}
      />
    </button>
  )
}
