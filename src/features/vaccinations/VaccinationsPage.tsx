import type { ChildFeaturePageProps } from "@/types"
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder"

/** Frontend B replaces this screen. Keep the named export and childId prop. */
export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  return (
    <FeaturePlaceholder
      title="Vaccinations"
      description="The vaccine milestone screen is not built yet."
      childId={childId}
    />
  )
}
