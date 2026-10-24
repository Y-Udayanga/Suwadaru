import type { ReactNode } from "react"
import { BrowserRouter } from "react-router"
import { AuthProvider } from "@/auth/AuthProvider"

export function AppProviders({ children }: { children: ReactNode }) {
  return <AuthProvider><BrowserRouter>{children}</BrowserRouter></AuthProvider>
}
