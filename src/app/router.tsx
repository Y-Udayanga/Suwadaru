import type { ComponentType } from "react"
import { AuthCallbackPage } from "@/auth/AuthCallbackPage"
import { ConnectedAuthRoutes, AccountAppProviders } from "./providers"
import { Route, Routes, useParams } from "react-router"
import { AppShell } from "@/components/layout/AppShell"
import { NotFoundPage } from "@/components/layout/NotFoundPage"
import { PublicRoutes } from "@/components/layout/SiteFrame"
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { ProtectedRoute } from "@/features/auth/ProtectedRoute"
import { AppointmentsPage } from "@/features/appointments/AppointmentsPage"
import { AddChildPage } from "@/features/children/AddChildPage"
import { ChildOverviewPage } from "@/features/children/ChildOverviewPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { GrowthPage } from "@/features/growth/GrowthPage"
import { LandingPage } from "@/features/landing/LandingPage"
import { NutritionPage } from "@/features/nutrition/NutritionPage"
import { GeminiPlaygroundPage } from "@/features/ai/GeminiPlaygroundPage"
import { TodosPage } from "@/features/todos/TodosPage"
import { VaccinationsPage } from "@/features/vaccinations/VaccinationsPage"
import type { ChildFeaturePageProps } from "@/types"

import { useChild } from "@/features/children"
import { LoadingSkeleton } from "@/components/layout/LoadingSkeleton"

function ChildFeatureRoute({
  page: Page,
}: {
  page: ComponentType<ChildFeaturePageProps>
}) {
  const params = useParams()
  const childId = params.childId
  const { children, isLoading } = useChild()

  if (!childId) {
    return <NotFoundPage />
  }

  if (isLoading && children.length === 0) {
    return (
      <div className="flex flex-col gap-4 p-4" role="status" aria-live="polite">
        <LoadingSkeleton rows={4} />
      </div>
    )
  }

  const exists = children.some((c) => c.id === childId)
  if (!exists) {
    return (
      <NotFoundPage
        title="Child profile not found"
        description={`The requested child profile "${childId}" is not accessible to this account.`}
        homeTo="/dashboard"
        homeLabel="Return to Dashboard"
      />
    )
  }

  return <Page key={childId} childId={childId} />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<ConnectedAuthRoutes />}>
        <Route path="auth/callback" element={<AuthCallbackPage />} />
        <Route path="reset-password" element={<AuthCallbackPage resetPassword />} />
      </Route>
      <Route element={<AccountAppProviders />}>
        <Route element={<PublicRoutes />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="ai" element={<GeminiPlaygroundPage />} />
          <Route path="todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Authenticated parent shell guarded by ProtectedRoute (FR-004) */}
        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="children/new" element={<AddChildPage />} />
          <Route
            path="children/:childId"
            element={<ChildFeatureRoute page={ChildOverviewPage} />}
          />
          <Route
            path="children/:childId/vaccinations"
            element={<ChildFeatureRoute page={VaccinationsPage} />}
          />
          <Route
            path="children/:childId/growth"
            element={<ChildFeatureRoute page={GrowthPage} />}
          />
          <Route
            path="children/:childId/nutrition"
            element={<ChildFeatureRoute page={NutritionPage} />}
          />
          <Route
            path="children/:childId/appointments"
            element={<ChildFeatureRoute page={AppointmentsPage} />}
          />
        </Route>
      </Route>
    </Routes>
  )
}
