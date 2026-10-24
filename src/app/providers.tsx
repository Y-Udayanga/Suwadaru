import type { ReactNode } from "react"
import { BrowserRouter, Outlet } from "react-router"
import { AuthProvider as ConnectedAuthProvider } from "@/auth/AuthProvider"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider as DemoAuthProvider } from "@/features/auth"
import { ChildProvider } from "@/features/children"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
    </BrowserRouter>
  )
}

/** Preserve the frontend's fictional demo without treating it as Supabase auth. */
export function DemoAppProviders() {
  return (
    <DemoAuthProvider>
      <ChildProvider><Outlet /></ChildProvider>
    </DemoAuthProvider>
  )
}

/** Real email callbacks have their own identity boundary, outside demo guards. */
export function ConnectedAuthRoutes() {
  return <ConnectedAuthProvider><Outlet /></ConnectedAuthProvider>
}
