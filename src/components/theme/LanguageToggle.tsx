import { Languages } from "lucide-react"
import { useLanguage } from "@/hooks/useLanguage"
import { cn } from "@/lib/utils"

interface LanguageToggleProps {
  className?: string
  compact?: boolean
}

export function LanguageToggle({ className, compact = false }: LanguageToggleProps) {
  const { language, toggleLanguage } = useLanguage()
  const isSinhala = language === "si"

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={
        isSinhala ? "Switch to English" : "සිංහල භාෂාවට මාරු වන්න"
      }
      title={
        isSinhala ? "Switch language to English" : "සිංහල භාෂාවට මාරු වන්න"
      }
      className={cn(
        "group relative inline-flex items-center justify-center cursor-pointer select-none",
        "h-9 rounded-full border border-border/80 bg-card/80 hover:bg-accent/80 hover:border-accent-foreground/30 shadow-2xs backdrop-blur-sm",
        "transition-all duration-300",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-95",
        compact ? "px-2.5 gap-1.5" : "px-3 gap-2",
        className,
      )}
    >
      <Languages
        aria-hidden
        className="size-4 text-primary transition-transform duration-300 group-hover:scale-110"
      />
      <span className="text-xs font-semibold tracking-tight">
        {isSinhala ? (
          <span className="text-primary font-bold">සිංහල</span>
        ) : (
          <span className="text-foreground/80">EN</span>
        )}
      </span>
      <span className="text-[10px] text-muted-foreground/60 hidden sm:inline">
        {isSinhala ? "EN" : "සිං"}
      </span>
    </button>
  )
}
