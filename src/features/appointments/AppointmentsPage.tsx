import type { ChildFeaturePageProps } from "@/types"
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder"

/** Frontend B replaces this screen. Keep the named export and childId prop. */
export function AppointmentsPage({ childId }: ChildFeaturePageProps) {
  return (
    <FeaturePlaceholder
      title="Appointments"
      description="The clinic visit screen is not built yet. No reminder is sent."
      childId={childId}
    />
  )
}
