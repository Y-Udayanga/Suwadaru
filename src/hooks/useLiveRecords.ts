import { useCallback, useEffect, useRef, useState } from 'react'
import { watchRecords } from '@/services/realtime'

export function useLiveRecords<T>(load: () => Promise<T>, tables: readonly string[], childId?: string) {
  const [state, setState] = useState<{ load: typeof load; data: T | null; error: string | null } | null>(null)
  const request = useRef({ load, version: 0, active: false })
  const refresh = useCallback(async () => {
    const scope = request.current
    if (!scope.active || scope.load !== load) return
    const current = ++scope.version
    try {
      const result = await load()
      if (scope.active && scope.version === current) setState({ load, data: result, error: null })
    } catch (cause) {
      if (scope.active && scope.version === current) setState({ load, data: null,
        error: cause instanceof Error ? cause.message : 'Records could not be loaded. Please retry.' })
    }
  }, [load])
  useEffect(() => {
    const scope = { load, version: 0, active: true }
    request.current = scope
    const stop = watchRecords(tables, () => { void refresh() }, childId)
    void Promise.resolve().then(refresh)
    return () => { scope.active = false; ++scope.version; stop() }
  }, [load, refresh, tables, childId])
  const current = state?.load === load ? state : null
  return { data: current?.data ?? null, error: current?.error ?? null, loading: !current, refresh }
}
