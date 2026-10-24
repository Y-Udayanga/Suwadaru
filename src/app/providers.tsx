import type { ReactNode } from "react"
import { BrowserRouter, Outlet } from "react-router"
import { AuthProvider as ConnectedAuthProvider } from "@/auth/AuthProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ChildProvider } from "@/features/children"

import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { LanguageProvider } from "@/components/theme/LanguageProvider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
      <BrowserRouter>
        <ConnectedAuthProvider><TooltipProvider delayDuration={400}>{children}</TooltipProvider></ConnectedAuthProvider>
      </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}

/** Child state is scoped to the current authenticated account. */
export function AccountAppProviders() {
  return (
    <ChildProvider><Outlet /></ChildProvider>
  )
}

/** Real email callbacks have their own identity boundary, outside demo guards. */
export function ConnectedAuthRoutes() {
  return <Outlet />
}
