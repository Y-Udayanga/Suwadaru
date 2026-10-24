import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { AppLogo } from "./AppLogo"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { LanguageToggle } from "@/components/theme/LanguageToggle"
import { AmbientBackground } from "@/components/common/AmbientBackground"
import { useLanguage, type TranslationKey } from "@/hooks/useLanguage"

// ---------------------------------------------------------------------------
// PublicFrame — wrapper for unauthenticated pages (landing, login, register)
// ---------------------------------------------------------------------------

const publicNavDef: { to: string; labelKey: TranslationKey; fallback: string; end?: boolean }[] = [
  { to: routes.home, labelKey: "nav.home", fallback: "Home", end: true },
  { to: routes.login, labelKey: "nav.signIn", fallback: "Sign in", end: true },
  { to: routes.register, labelKey: "nav.register", fallback: "Register", end: true },
  { to: routes.forgotPassword, labelKey: "nav.recovery", fallback: "Reset password", end: true },
]

const publicLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex min-h-10 items-center rounded-xl px-3.5 text-sm font-semibold",
    "transition-all duration-200",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    isActive
      ? "bg-primary text-white shadow-sm hover:bg-primary/95 active:scale-95"
      : "text-foreground/80 hover:bg-accent/70 hover:text-foreground",
  )

function PublicHeader() {
  const { t } = useLanguage()

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md supports-backdrop-filter:bg-background/75 shadow-xs transition-colors duration-200">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <AppLogo asLink />

        {/* Spacer */}
        <div className="flex-1" />
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <nav aria-label="Public navigation">
            <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
              {publicNavDef.map((item) => (
                <li key={item.to}>
                  <NavLink to={item.to} end={item.end} className={publicLinkClass}>
                    {t(item.labelKey, item.fallback)}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <NavLink to="/ai" className={publicLinkClass}>AI assistant</NavLink>
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}


export function PublicLayout({ children }: { children: ReactNode }) {
  const { language } = useLanguage()
  const isSi = language === "si"

  return (
    <div className="relative flex min-h-svh min-w-0 flex-col bg-background/30 text-foreground transition-colors duration-300">
      <AmbientBackground />
      {/* Skip link */}

      <a
        href="#main"
        className={cn(
          "absolute top-3 left-3 z-50 -translate-y-20 rounded-lg",
          "bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg",
          "focus:translate-y-0",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "transition-transform duration-150",
        )}
      >
        {isSi ? "ප්‍රධාන අන්තර්ගතයට යන්න" : "Skip to content"}
      </a>

      <PublicHeader />

      <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border bg-card/60 backdrop-blur-sm px-4 py-6">
        <div className="mx-auto max-w-6xl text-xs text-muted-foreground text-center sm:text-left leading-relaxed">
          {isSi
            ? "සුවදරු යනු දෙමාපිය සහ සත්කාරක අත්වැලකි. මෙය සායනික වාර්තාවක්, රජයේ නිල සේවාවක් හෝ වෛද්‍යවරයෙකුගේ හෝ පවුල් සෞඛ්‍ය සේවා නිලධාරිනියගේ උපදෙස් වෙනුවට භාවිත කළ හැකි ආදේශකයක් නොවේ."
            : "SuwaDaru is a caregiver companion. Not a clinical record, a government service, or a substitute for a midwife or doctor."}
        </div>
      </footer>
    </div>
  )
}

export function PublicRoutes() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  )
}

// Keep SiteFrame exported for backwards-compat in case something imports it
export { PublicLayout as SiteFrame }

