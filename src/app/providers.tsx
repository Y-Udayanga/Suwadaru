import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

