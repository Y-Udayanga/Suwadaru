import { Outlet } from "react-router"
import { fixtureIds } from "@/data/mock"
import { routes } from "@/app/routes"
import { SiteFrame } from "./SiteFrame"

const appNav = [
  { to: routes.dashboard, label: "Dashboard", end: true },
  { to: routes.newChild, label: "Add child", end: true },
  { to: routes.child(fixtureIds.nethmi), label: "Nethmi", end: true },
  { to: routes.vaccinations(fixtureIds.nethmi), label: "Nethmi vaccines" },
  { to: routes.growth(fixtureIds.nethmi), label: "Nethmi growth" },
  { to: routes.nutrition(fixtureIds.nethmi), label: "Nethmi nutrition" },
  { to: routes.appointments(fixtureIds.nethmi), label: "Nethmi visits" },
  { to: routes.child(fixtureIds.kavindu), label: "Kavindu", end: true },
  { to: routes.vaccinations(fixtureIds.kavindu), label: "Kavindu vaccines" },
  { to: routes.growth(fixtureIds.kavindu), label: "Kavindu growth" },
  { to: routes.nutrition(fixtureIds.kavindu), label: "Kavindu nutrition" },
  { to: routes.appointments(fixtureIds.kavindu), label: "Kavindu visits" },
] as const

export function AppShell() {
  return (
    <SiteFrame navLabel="Application" items={appNav}>
      <Outlet />
    </SiteFrame>
  )
}
