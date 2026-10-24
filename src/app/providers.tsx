import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth"
import { ChildProvider } from "@/features/children"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ChildProvider>
          <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
        </ChildProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}


