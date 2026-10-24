import { supabase } from '@/utils/supabase'

/** Events invalidate queries. Reconnect/focus/polling repair missed events. */
export function watchRecords(tables: readonly string[], refresh: () => void, childId?: string) {
  if (!supabase) return () => {}
  let stopped = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const invalidate = () => {
    clearTimeout(timer)
    timer = setTimeout(() => { if (!stopped) refresh() }, 100)
  }
  const channel = supabase.channel(`records:${crypto.randomUUID()}`)
  for (const table of tables) channel.on('postgres_changes', {
    event: '*', schema: 'public', table,
    ...(childId ? { filter: `child_id=eq.${childId}` } : {}),
  }, invalidate)
  channel.subscribe(status => {
    if (status === 'SUBSCRIBED') invalidate()
  })
  const visible = () => { if (document.visibilityState === 'visible') invalidate() }
  window.addEventListener('online', invalidate)
  window.addEventListener('focus', invalidate)
  document.addEventListener('visibilitychange', visible)
  const poll = setInterval(visible, 30000)
  return () => {
    stopped = true
    clearTimeout(timer)
    clearInterval(poll)
    window.removeEventListener('online', invalidate)
    window.removeEventListener('focus', invalidate)
    document.removeEventListener('visibilitychange', visible)
    void supabase?.removeChannel(channel)
  }
}
