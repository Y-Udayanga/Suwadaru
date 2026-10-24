import type { ReactNode } from "react"
import { Navigate, Outlet, useLocation } from "react-router"
import { routes } from "@/app/routes"
import { useAuth } from "./useAuth"
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton"

interface ProtectedRouteProps {
  children?: ReactNode
}

/**
 * Route guard that requires an active demo session.
 * Unauthenticated visitors are redirected to /login with return location preserved.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6"
      >
        <span className="sr-only">Checking demo session...</span>
        <div className="flex flex-col gap-2">
          <LoadingSkeleton rows={2} />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
          <LoadingSkeleton rows={3} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace state={{ from: location.pathname }} />
  }

  return children ? <>{children}</> : <Outlet />
}
