import type { ComponentType } from "react"
import { Route, Routes, useParams } from "react-router"
import { AppShell } from "@/components/layout/AppShell"
import { NotFoundPage } from "@/components/layout/NotFoundPage"
import { PublicRoutes } from "@/components/layout/SiteFrame"
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage"
import { LoginPage } from "@/features/auth/LoginPage"
import { RegisterPage } from "@/features/auth/RegisterPage"
import { AppointmentsPage } from "@/features/appointments/AppointmentsPage"
import { AddChildPage } from "@/features/children/AddChildPage"
import { ChildOverviewPage } from "@/features/children/ChildOverviewPage"
import { DashboardPage } from "@/features/dashboard/DashboardPage"
import { GrowthPage } from "@/features/growth/GrowthPage"
import { LandingPage } from "@/features/landing/LandingPage"
import { NutritionPage } from "@/features/nutrition/NutritionPage"
import { TodosPage } from "@/features/todos/TodosPage"
import { VaccinationsPage } from "@/features/vaccinations/VaccinationsPage"
import type { ChildFeaturePageProps } from "@/types"

function ChildFeatureRoute({
  page: Page,
}: {
  page: ComponentType<ChildFeaturePageProps>
}) {
  const params = useParams()
  const childId = params.childId

  if (!childId) {
    return <NotFoundPage />
  }

  return <Page key={childId} childId={childId} />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicRoutes />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="todos" element={<TodosPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route element={<AppShell />}>
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
    </Routes>
  )
}
