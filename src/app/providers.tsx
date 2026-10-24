import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <BrowserRouter>
      <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
    </BrowserRouter>
  )
}
