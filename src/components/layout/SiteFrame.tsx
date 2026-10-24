import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { AppLogo } from "./AppLogo"

// ---------------------------------------------------------------------------
// PublicFrame — wrapper for unauthenticated pages (landing, login, register)
// ---------------------------------------------------------------------------

const publicNav = [
  { to: routes.home, label: "Home", end: true },
  { to: routes.login, label: "Sign in", end: true },
  { to: routes.register, label: "Register", end: true },
  { to: routes.forgotPassword, label: "Recovery preview", end: true },
] as const

const publicLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium",
    "transition-colors duration-150",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    "hover:bg-accent hover:text-accent-foreground",
    isActive
      ? "bg-primary text-primary-foreground hover:bg-primary/90"
      : "text-foreground/80",
  )

function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm supports-backdrop-filter:bg-card/80">
      <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
        <AppLogo asLink />
        {/* Spacer */}
        <div className="flex-1" />
        <nav aria-label="Public navigation">
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
            {publicNav.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={publicLinkClass}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-svh min-w-0 flex-col bg-background text-foreground">
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
        Skip to content
      </a>

      <PublicHeader />

      <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6">
        {children}
      </main>

      <footer className="border-t border-border bg-card px-4 py-6">
        <div className="mx-auto max-w-6xl text-xs text-muted-foreground">
          SuwaDaru is a fictional companion preview. Not a clinical record, a
          government service, or a substitute for a midwife or doctor.
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
