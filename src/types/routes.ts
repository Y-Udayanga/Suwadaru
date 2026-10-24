/**
 * Props for every child-scoped page.
 *
 * Frontend A owns the router. It reads `:childId` from the URL and passes
 * that value here. Frontend B exports a named component with this signature
 * and does not look up a different child from ambient state.
 */
export interface ChildFeaturePageProps {
  childId: string
}
