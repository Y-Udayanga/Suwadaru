import type { ChildFeaturePageProps } from "@/types"
import { FeaturePlaceholder } from "@/components/layout/FeaturePlaceholder"

/** Frontend B replaces this screen. Keep the named export and childId prop. */
export function NutritionPage({ childId }: ChildFeaturePageProps) {
  return (
    <FeaturePlaceholder
      title="Nutrition"
      description="The nutrition education screen is not built yet. No request is sent to a model."
      childId={childId}
    />
  )
}
