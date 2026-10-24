import type { ReactNode } from "react"
import { useState } from "react"
import { NavLink, Outlet, useNavigate } from "react-router"
import {
  LayoutDashboard,
  UserPlus,
  Baby,
  Syringe,
  TrendingUp,
  Salad,
  CalendarClock,
  Menu,
  LogOut,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { routes } from "@/app/routes"
import { demoCaregiver } from "@/data/mock"
import { AppLogo } from "./AppLogo"
import { UserMenuButton } from "./UserMenuButton"
import { useAuth } from "@/features/auth"
import { useChild, ChildSwitcher } from "@/features/children"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme/ThemeToggle"
import { LanguageToggle } from "@/components/theme/LanguageToggle"
import { AmbientBackground } from "@/components/common/AmbientBackground"
import { useLanguage, type TranslationKey } from "@/hooks/useLanguage"

// ---------------------------------------------------------------------------
// Nav item definitions
// ---------------------------------------------------------------------------

type NavItemDef = {
  to: string
  label: string
  icon: ReactNode
  end?: boolean
}

/** Primary app-level navigation (always visible) */
function getPrimaryNav(t: (key: TranslationKey, fallback?: string) => string): NavItemDef[] {
  return [
    {
      to: routes.dashboard,
      label: t("nav.dashboard", "Dashboard"),
      icon: <LayoutDashboard aria-hidden className="size-4 shrink-0" />,
      end: true,
    },
    {
      to: routes.newChild,
      label: t("nav.addChild", "Add Child"),
      icon: <UserPlus aria-hidden className="size-4 shrink-0" />,
      end: true,
    },
  ]
}

/** Sub-navigation items for a single child */
function getChildNav(childId: string, t: (key: TranslationKey, fallback?: string) => string): NavItemDef[] {
  return [
    {
      to: routes.child(childId),
      label: t("nav.overview", "Overview"),
      icon: <Baby aria-hidden className="size-4 shrink-0" />,
      end: true,
    },
    {
      to: routes.vaccinations(childId),
      label: t("nav.vaccinations", "Vaccinations"),
      icon: <Syringe aria-hidden className="size-4 shrink-0" />,
    },
    {
      to: routes.growth(childId),
      label: t("nav.growth", "Growth"),
      icon: <TrendingUp aria-hidden className="size-4 shrink-0" />,
    },
    {
      to: routes.nutrition(childId),
      label: t("nav.nutrition", "Nutrition"),
      icon: <Salad aria-hidden className="size-4 shrink-0" />,
    },
    {
      to: routes.appointments(childId),
      label: t("nav.appointments", "Appointments"),
      icon: <CalendarClock aria-hidden className="size-4 shrink-0" />,
    },
  ]
}


// ---------------------------------------------------------------------------
// Shared NavLink styling helpers
// ---------------------------------------------------------------------------

function navLinkClass(
  { isActive }: { isActive: boolean },
  collapsed = false,
) {
  return cn(
    // Layout
    "group relative flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold",
    // Transitions
    "transition-all duration-200",
    // Focus ring — always visible, not just on keyboard
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
    // State-dependent styling
    isActive
      ? "bg-gradient-to-r from-primary to-rose-600 text-white shadow-sm shadow-rose-900/15"
      : "text-foreground/80 hover:bg-accent/70 hover:text-foreground",
    // Collapsed: centre the icon, remove horizontal text padding
    collapsed && "justify-center px-0",
  )
}



// ---------------------------------------------------------------------------
// NavSection — renders a group of nav items
// ---------------------------------------------------------------------------

function NavSection({
  items,
  label,
  collapsed = false,
  onClose,
}: {
  items: NavItemDef[]
  label?: string
  collapsed?: boolean
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {label && !collapsed && (
        <p className="mb-1 px-3 text-[0.68rem] font-semibold tracking-widest text-muted-foreground uppercase select-none">
          {label}
        </p>
      )}
      <ul className="m-0 list-none p-0">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={(state) => navLinkClass(state, collapsed)}
              aria-label={collapsed ? item.label : undefined}
              onClick={onClose}
            >
              {item.icon}
              {!collapsed && (
                <span className="min-w-0 truncate">{item.label}</span>
              )}
              {!collapsed && (
                <ChevronRight
                  aria-hidden
                  className="ml-auto size-3.5 text-muted-foreground/40 transition-transform group-[.bg-primary]:hidden"
                />
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ChildSwitcherSection — renders a section per demo child
// ---------------------------------------------------------------------------

function ChildSwitcherSection({
  collapsed = false,
  onClose,
}: {
  collapsed?: boolean
  onClose?: () => void
}) {
  const { children, selectedChild } = useChild()
  const { t } = useLanguage()
  const activeChild = selectedChild || children[0]

  return (
    <div className="flex flex-col gap-3">
      {/* Switcher Component */}
      <div className={cn(collapsed ? "px-0" : "px-0.5")}>
        <ChildSwitcher
          collapsed={collapsed}
          onSelect={onClose}
        />
      </div>

      {/* Feature Navigation for Active Child */}
      {activeChild && (
        <NavSection
          items={getChildNav(activeChild.id, t)}
          label={!collapsed ? `${activeChild.name} • ${t("nav.records", "Records")}` : undefined}
          collapsed={collapsed}
          onClose={onClose}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// DesktopSidebar
// ---------------------------------------------------------------------------

function DesktopSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useLanguage()
  const primaryNav = getPrimaryNav(t)

  return (
    <aside
      aria-label="Application navigation"
      className={cn(
        // Layout
        "hidden md:flex flex-col gap-4",
        "min-h-svh shrink-0",
        "border-r border-border/70 bg-sidebar/95 backdrop-blur-md",
        // Transitions
        "transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      {/* Logo + collapse toggle */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-border px-4",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <AppLogo asLink className="flex-1" />
        )}
        {collapsed && (
          <AppLogo asLink collapsed className="flex-1 justify-center" />
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            "text-muted-foreground hover:bg-accent hover:text-foreground",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "transition-colors",
            collapsed ? "ml-0" : "ml-2",
          )}
        >
          <Menu aria-hidden className="size-4" />
        </button>
      </div>

      {/* Scrollable nav */}
      <nav
        aria-label="Main navigation"
        className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 pb-4"
      >
        <NavSection
          items={primaryNav}
          label={!collapsed ? t("nav.general", "General") : undefined}
          collapsed={collapsed}
        />


        <Separator className="my-0" />

        <ChildSwitcherSection collapsed={collapsed} />
      </nav>

      {/* User footer */}
      <div
        className={cn(
          "shrink-0 border-t border-border px-3 py-3",
          collapsed && "flex justify-center",
        )}
      >
        <UserMenuButton collapsed={collapsed} />
      </div>
    </aside>
  )
}

// ---------------------------------------------------------------------------
// MobileNav — top bar + Sheet drawer
// ---------------------------------------------------------------------------

function MobileNav() {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()
  const primaryNav = getPrimaryNav(t)

  return (
    <>
      {/* Mobile top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-background/85 backdrop-blur-md px-4 md:hidden shadow-2xs">
        <AppLogo asLink />

        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageToggle compact />
          <ThemeToggle variant="icon" />
          <UserMenuButton compact />
          <Button
            variant="ghost"
            size="icon"
            aria-label="Open navigation menu"
            aria-expanded={open}
            aria-controls="mobile-nav-sheet"
            onClick={() => setOpen(true)}
            className="size-9"
          >
            <Menu aria-hidden className="size-5" />
          </Button>
        </div>
      </header>

      {/* Slide-in drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          id="mobile-nav-sheet"
          side="left"
          showCloseButton={false}
          className="flex w-72 flex-col gap-0 p-0"
          aria-label="Navigation drawer"
        >
          <SheetHeader className="flex h-14 flex-row items-center justify-between border-b border-border px-4 py-0">
            <SheetTitle>
              <span onClick={() => setOpen(false)} role="presentation">
                <AppLogo asLink />
              </span>
            </SheetTitle>
            <SheetClose asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Close navigation"
                className="shrink-0"
              >
                ✕
              </Button>
            </SheetClose>
          </SheetHeader>

          <nav
            aria-label="Mobile navigation"
            className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4"
          >
            <NavSection
              items={primaryNav}
              label={t("nav.general", "General")}
              onClose={() => setOpen(false)}
            />
            <Separator className="my-0" />
            <ChildSwitcherSection onClose={() => setOpen(false)} />
          </nav>

          <div className="shrink-0 border-t border-border px-3 py-3">
            <DemoSignOutButton />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Demo sign-out helper (mobile drawer footer only)
// ---------------------------------------------------------------------------

function DemoSignOutButton() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { t } = useLanguage()

  async function handleSignOut() {
    try {
      await logout()
    } finally {
      void navigate(routes.login)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className={cn(
        "flex w-full min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
        "text-muted-foreground hover:bg-accent hover:text-foreground",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "transition-colors cursor-pointer",
      )}
    >
      <LogOut aria-hidden className="size-4 shrink-0" />
      {t("nav.signOut", "Sign out (demo)")}
    </button>
  )
}

// ---------------------------------------------------------------------------
// AppShell — root authenticated layout
// ---------------------------------------------------------------------------

/**
 * AppShell
 *
 * The root layout wrapper for all authenticated (post-login) routes.
 * Renders a desktop sidebar at ≥768 px and a mobile top bar + slide-in
 * drawer below 768 px. Page content is delivered via React Router <Outlet />.
 */
export function AppShell() {
  const { session } = useAuth()
  const displayName = session?.displayName || demoCaregiver.displayName

  return (
    <div className="relative flex min-h-svh min-w-0 bg-background/80 text-foreground transition-colors duration-300">
      <AmbientBackground />
      {/* Skip link — keyboard users jump past navigation */}
      <a
        href="#main-content"
        className={cn(
          "absolute top-3 left-3 z-50 -translate-y-20",
          "rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
          "shadow-lg focus:translate-y-0",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
          "transition-transform duration-150",
        )}
      >
        Skip to content
      </a>

      {/* Desktop sidebar — hidden on mobile */}
      <DesktopSidebar />

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Desktop top bar */}
        <header className="hidden h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/85 backdrop-blur-md px-6 md:flex shadow-2xs transition-colors duration-200">
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Fictional demo —{" "}
              <span className="font-medium text-foreground">
                {displayName}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <LanguageToggle />
            <ThemeToggle />
            <UserMenuButton />
          </div>
        </header>



        {/* Mobile top bar — rendered here but visible only on mobile */}
        <MobileNav />

        {/* Page content slot */}
        <main
          id="main-content"
          tabIndex={-1}
          className="flex min-w-0 flex-1 flex-col px-4 py-6 outline-none md:px-6 lg:px-8"
        >
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="shrink-0 border-t border-border px-6 py-4 text-xs text-muted-foreground">
          SuwaDaru is a fictional demonstration companion. Not a clinical record,
          government service, or substitute for professional healthcare advice.
        </footer>
      </div>
    </div>
  )
}
