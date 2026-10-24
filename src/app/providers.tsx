import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/features/auth"
import { ChildProvider } from "@/features/children"

import { ThemeProvider } from "@/components/theme/ThemeProvider"
import { LanguageProvider } from "@/components/theme/LanguageProvider"

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <ChildProvider>
              <TooltipProvider delayDuration={400}>{children}</TooltipProvider>
            </ChildProvider>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  )
}




