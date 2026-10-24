import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

/** UI convenience only; database RLS remains the authorization boundary. */
export function RequireAuth() {
  const { loading, isAuthenticated, error } = useAuth()
  if (loading) return <p role="status">Restoring your session…</p>
  if (error) return <p role="alert">{error.message} Reload the page to retry.</p>
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
