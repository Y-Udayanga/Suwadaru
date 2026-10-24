import type { ChildFeaturePageProps } from "@/types"
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder"

/** Frontend B replaces this screen. Keep the named export and childId prop. */
export function GrowthPage({ childId }: ChildFeaturePageProps) {
  return (
    <FeaturePlaceholder
      title="Growth"
      description="The growth chart screen is not built yet."
      childId={childId}
    />
  )
}
