import type { ReactNode } from "react"
import { NavLink, Outlet } from "react-router"
import { HeartPulse } from "lucide-react"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"

type NavItem = {
  to: string
  label: string
  end?: boolean
}

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-mint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    isActive && "bg-primary text-primary-foreground hover:bg-primary",
  )

export function SiteFrame({
  navLabel,
  items,
  children,
}: {
  navLabel: string
  items: readonly NavItem[]
  children: ReactNode
}) {
  return (
    <div className="relative flex min-h-svh min-w-0 flex-col bg-background text-foreground">
      <a
        href="#main"
        className="absolute top-3 left-3 z-10 -translate-y-16 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground focus:translate-y-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Skip to content
      </a>
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl min-w-0 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
          <NavLink
            to={routes.home}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg font-semibold text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <HeartPulse aria-hidden="true" />
            SuwaDaru
          </NavLink>
          <p className="text-sm text-muted-foreground">Companion preview</p>
        </div>
        <nav aria-label={navLabel} className="mx-auto w-full max-w-6xl min-w-0 px-4 pb-3">
          <ul className="m-0 flex list-none flex-wrap gap-1 p-0">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.end} className={linkClassName}>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" className="mx-auto w-full max-w-6xl min-w-0 flex-1 px-4 py-6">
        {children}
      </main>
      <footer className="mx-auto w-full max-w-6xl min-w-0 px-4 py-6 text-sm text-muted-foreground">
        SuwaDaru is a fictional companion preview. It is not a clinical record,
        a government service, or a substitute for a midwife or doctor.
      </footer>
    </div>
  )
}

const publicNav = [
  { to: routes.home, label: "Home", end: true },
  { to: routes.login, label: "Sign in", end: true },
  { to: routes.register, label: "Register", end: true },
  { to: routes.forgotPassword, label: "Recovery preview", end: true },
  { to: routes.dashboard, label: "Dashboard", end: true },
] as const satisfies readonly NavItem[]

export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <SiteFrame navLabel="Public" items={publicNav}>
      {children}
    </SiteFrame>
  )
}

export function PublicRoutes() {
  return (
    <PublicLayout>
      <Outlet />
    </PublicLayout>
  )
}
