import type { Child, CreateChildInput } from '../../types/child'
import type { ConnectedChildService } from '../children/child-service'
import { AppError } from '../contracts/errors'

export interface ChildSelectionState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  children: readonly Child[]
  selectedChildId: string | null
  saving: boolean
  error: AppError | null
}

/** One in-memory instance per authenticated shell. Never writes browser storage. */
export function createChildSelection(service: Pick<ConnectedChildService, 'getMyChildren' | 'createChild'>, userId: string | null) {
  const empty = (): ChildSelectionState => ({ status: userId ? 'loading' : 'idle', children: [], selectedChildId: null, saving: false, error: null })
  let state = empty()
  let active = false
  let version = 0
  const listeners = new Set<() => void>()
  const publish = (next: ChildSelectionState) => { state = next; listeners.forEach(listener => listener()) }
  const safeError = (error: unknown) => error instanceof AppError ? error
    : new AppError('unavailable', 'Child profiles are unavailable. Please try again.')
  const requireAccount = () => {
    if (!userId || !active) throw new AppError('unauthenticated', 'Sign in to manage child profiles.')
  }

  async function refresh(): Promise<readonly Child[]> {
    requireAccount()
    // Do not let a list started during creation overwrite the returned child.
    if (state.saving) return state.children
    const request = ++version
    publish({ ...state, status: 'loading', error: null })
    try {
      const children = await service.getMyChildren()
      if (active && request === version) {
        const selectedChildId = children.some(child => child.id === state.selectedChildId)
          ? state.selectedChildId : children[0]?.id ?? null
        publish({ ...state, children, selectedChildId, status: 'ready', error: null })
      }
      return children
    } catch (error) {
      const failure = safeError(error)
      if (active && request === version) publish({ ...state, children: [], selectedChildId: null, status: 'error', error: failure })
      throw failure
    }
  }

  async function createChild(input: CreateChildInput): Promise<Child> {
    requireAccount()
    if (state.saving) throw new AppError('validation', 'A child profile is already being saved.')
    const request = ++version
    publish({ ...state, saving: true, error: null })
    try {
      const child = await service.createChild(input)
      // A response from the previous login must never repopulate the new account.
      if (!active || request !== version) throw new AppError('unauthenticated', 'The account changed. Sign in and reload your child profiles.')
      publish({ status: 'ready', saving: false, error: null, selectedChildId: child.id,
        children: [...state.children.filter(item => item.id !== child.id), child] })
      return child
    } catch (error) {
      const failure = safeError(error)
      if (active && request === version) publish(failure.code === 'unauthenticated'
        ? { ...empty(), status: 'error', error: failure }
        : { ...state, status: state.children.length ? 'ready' : 'error', saving: false, error: failure })
      throw failure
    }
  }

  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } },
    start: () => { active = true; if (userId) void refresh().catch(() => {}) },
    stop: () => { active = false; version++; publish(empty()) },
    refresh,
    createChild,
    selectChild: (childId: string) => {
      requireAccount()
      if (!state.children.some(child => child.id === childId)) throw new AppError('not_found', 'Choose an available child profile.')
      publish({ ...state, selectedChildId: childId })
    },
  }
}
