import type { ChildFeaturePageProps } from "@/types"
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder"

export function ChildOverviewPage({ childId }: ChildFeaturePageProps) {
  return (
    <FeaturePlaceholder
      title="Child overview"
      description="The child profile screen is not built yet."
      childId={childId}
    />
  )
}
