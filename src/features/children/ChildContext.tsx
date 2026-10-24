import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { useLocation, useNavigate } from "react-router"
import type { Child, CreateChildInput, UpdateChildInput } from "@/types"
import { AppError } from "@/services/contracts"
import { mockChildService } from "@/services/mock-child-service"
import {
  createCaregiverChild,
  hasCaregiverSession,
  listCaregiverChildren,
  updateCaregiverChild,
} from "@/services/health"
import { supabase } from "@/utils/supabase"
import { routes } from "@/app/routes"

export interface ChildContextValue {
  /** All registered fictional children */
  children: Child[]
  /** ID of the currently active child */
  selectedChildId: string | null
  /** Currently active child object or null if none selected */
  selectedChild: Child | null
  /** Whether children are currently loading */
  isLoading: boolean
  /** Any general error message from operations */
  error: string | null
  /** Switch the active child, preserving current sub-route if on a child page */
  selectChild: (childId: string, navigateToChild?: boolean) => void
  /** Create a new fictional child profile */
  addChild: (input: CreateChildInput) => Promise<Child>
  /** Update an existing child's demographic fields */
  updateChild: (childId: string, input: UpdateChildInput) => Promise<Child>
  /** Reload children list from storage/service */
  refreshChildren: () => Promise<void>
}

const ChildContext = createContext<ChildContextValue | null>(null)

export interface ChildProviderProps {
  children: ReactNode
}

export function ChildProvider({ children }: ChildProviderProps) {
  const [childList, setChildList] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const location = useLocation()
  const navigate = useNavigate()

  // Load caregiver children when a Supabase session exists. Otherwise keep the demo list.
  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const remote = await listCaregiverChildren()
        const list = remote ?? (await mockChildService.list())
        if (mounted) {
          setChildList(list)
          setError(null)
          setIsLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof AppError ? err.message : "Failed to load child profiles.")
          setIsLoading(false)
        }
      }
    }
    void load()
    const { data } = supabase.auth.onAuthStateChange(() => {
      if (mounted) void load()
    })
    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  // Derive active child ID from URL if on /children/:childId, or fall back to selected/default
  const urlMatch = location.pathname.match(/^\/children\/([^/]+)/)
  const urlChildId = urlMatch && urlMatch[1] !== "new" ? urlMatch[1] : null

  const activeChildId = useMemo(() => {
    if (urlChildId && childList.some((c) => c.id === urlChildId)) {
      return urlChildId
    }
    if (selectedChildId && childList.some((c) => c.id === selectedChildId)) {
      return selectedChildId
    }
    return childList.length > 0 ? childList[0].id : null
  }, [urlChildId, selectedChildId, childList])

  const selectChild = useCallback(
    (childId: string, navigateToChild = true) => {
      setSelectedChildId(childId)

      if (navigateToChild) {
        // If currently on a child-specific subpage, preserve the sub-route (e.g. /growth, /vaccinations)
        const match = location.pathname.match(
          /^\/children\/[^/]+(\/(?:vaccinations|growth|nutrition|appointments))?$/,
        )
        if (match) {
          const subPath = match[1] || ""
          void navigate(`/children/${encodeURIComponent(childId)}${subPath}`)
        } else {
          // Default to child overview
          void navigate(routes.child(childId))
        }
      }
    },
    [location.pathname, navigate],
  )

  const addChild = useCallback(
    async (input: CreateChildInput): Promise<Child> => {
      setIsLoading(true)
      try {
        const created = (await hasCaregiverSession())
          ? await createCaregiverChild(input)
          : await mockChildService.create(input)
        setChildList((prev) => [...prev, created])
        setSelectedChildId(created.id)
        return created
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const updateChild = useCallback(
    async (childId: string, input: UpdateChildInput): Promise<Child> => {
      setIsLoading(true)
      try {
        const updated = (await hasCaregiverSession())
          ? await updateCaregiverChild(childId, input)
          : await mockChildService.update(childId, input)
        setChildList((prev) =>
          prev.map((c) => (c.id === childId ? updated : c)),
        )
        return updated
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const selectedChild = useMemo(() => {
    if (!activeChildId) return null
    return childList.find((c) => c.id === activeChildId) || null
  }, [childList, activeChildId])

  const refreshChildren = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const remote = await listCaregiverChildren()
      setChildList(remote ?? (await mockChildService.list()))
    } catch {
      setError("Failed to load child profiles.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const value: ChildContextValue = {
    children: childList,
    selectedChildId: activeChildId,
    selectedChild,
    isLoading,
    error,
    selectChild,
    addChild,
    updateChild,
    refreshChildren,
  }

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>
}

export { ChildContext }
