import { useEffect, useMemo, useSyncExternalStore } from 'react'
import { useAuth } from './useAuth'
import { childService } from '../services/children'
import type { ConnectedChildService } from '../services/children'
import { createChildSelection } from '../services/integration/child-selection'

/** Mount once in the connected AppShell; distribute through Outlet context.
 * A different user gets a new store immediately, before effects run.
 */
export function useChildProfiles(service: ConnectedChildService = childService) {
  const auth = useAuth()
  const userId = auth.isAuthenticated ? auth.user?.id ?? null : null
  const store = useMemo(() => createChildSelection(service, userId), [service, userId])
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot)
  useEffect(() => { store.start(); return store.stop }, [store])
  return {
    ...state,
    loading: auth.loading || state.status === 'loading',
    selectedChild: state.children.find(child => child.id === state.selectedChildId) ?? null,
    selectChild: store.selectChild,
    createChild: store.createChild,
    refresh: store.refresh,
  }
}

export type ChildProfilesContext = ReturnType<typeof useChildProfiles>
