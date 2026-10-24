import { useContext } from "react"
import { ChildContext, type ChildContextValue } from "./ChildContext"
import type { Child } from "@/types"

/**
 * Accesses the full child management context.
 */
export function useChild(): ChildContextValue {
  const context = useContext(ChildContext)
  if (!context) {
    throw new Error("useChild must be used within a <ChildProvider>.")
  }
  return context
}

/**
 * Dedicated hook for health feature modules (Member B) to easily read the
 * currently selected child profile without coupling to management methods.
 */
export function useSelectedChild(): {
  child: Child | null
  childId: string | null
  isLoading: boolean
  error: string | null
} {
  const { selectedChild, selectedChildId, isLoading, error } = useChild()
  return {
    child: selectedChild,
    childId: selectedChildId,
    isLoading,
    error,
  }
}
