/**
 * @file src/components/layout/index.ts
 *
 * Barrel export for all global layout components.
 * Frontend B imports from here — do not import internal files directly.
 *
 * ──────────────────────────────────────────────────────────────────────────
 * COMPONENT PROP REFERENCE FOR FRONTEND B
 * ──────────────────────────────────────────────────────────────────────────
 *
 * AppShell        — authenticated shell; already in router.tsx, no import needed
 * AppLogo         — { collapsed?, asLink?, className? }
 * PageHeader      — { title, subtitle?, actions?, className? }
 * StatCard        — { label, value, detail?, icon?, accent?, className? }
 *                   accent: "teal" | "gold" | "coral" | "neutral" (default neutral)
 *                   NEVER use green "healthy" or red "danger" without evidence text
 * EmptyState      — { icon?, title, description, action?, className? }
 * ErrorState      — { title?, description?, action?, className? }
 * LoadingSkeleton — { variant?, rows?, className? }
 *                   variant: "page" | "card" | "list" | "chart" (default "page")
 * NotFoundPage    — no props; used by router for unmatched routes
 * FeaturePlaceholder — { title, description, childId? } (dev-only scaffold)
 *
 * ──────────────────────────────────────────────────────────────────────────
 * Usage in a Frontend B health page:
 *
 *   import { PageHeader, EmptyState, LoadingSkeleton } from "@/components/layout"
 *
 *   export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
 *     if (loading) return <LoadingSkeleton variant="list" />
 *     if (error)   return <ErrorState action={<Button onClick={retry}>Retry</Button>} />
 *     if (!records.length) return (
 *       <EmptyState
 *         icon={<Syringe />}
 *         title="No vaccination records"
 *         description="Add a parent-reported date, or check back after a clinic visit."
 *         action={<Button size="sm">Add record</Button>}
 *       />
 *     )
 *     return (
 *       <>
 *         <PageHeader title="Vaccinations" subtitle={childName} />
 *         ...
 *       </>
 *     )
 *   }
 * ──────────────────────────────────────────────────────────────────────────
 */

export { AppLogo } from "./AppLogo"
export { AppShell } from "./AppShell"
export { EmptyState, ErrorState } from "./FeedbackStates"
export { FeaturePlaceholder } from "./FeaturePlaceholder"
export { LoadingSkeleton } from "./LoadingSkeleton"
export { NotFoundPage } from "./NotFoundPage"
export { PageHeader } from "./PageHeader"
export { PublicLayout, PublicRoutes } from "./SiteFrame"
export { StatCard } from "./StatCard"
export { UserMenuButton } from "./UserMenuButton"
export type { StatCardAccent } from "./StatCard"
