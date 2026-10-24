import { useCallback, useState, type FormEvent } from 'react'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { database, check, listRows } from '@/services/health'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/hooks/useLanguage'
import { Plus, ListTodo } from 'lucide-react'

const tables = ['todos']
type Todo = { id: string; title: string; completed: boolean }

export function TodosPage() {
  const { language } = useLanguage()
  const isSi = language === 'si'
  const load = useCallback(() => listRows<Todo>('todos'), [])
  const { data, error, loading, refresh } = useLiveRecords(load, tables)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)

  async function add(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const title = String(new FormData(form).get('title'))
    setBusy(true)
    setFailure('')
    try {
      const { error } = await database().from('todos').insert({ title }).select().single()
      check(error)
      form.reset()
      await refresh()
    } catch (e) {
      setFailure(e instanceof Error ? e.message : isSi ? 'සුරැකීමට නොහැකි විය.' : 'Unable to save.')
    } finally {
      setBusy(false)
    }
  }

  async function toggle(t: Todo) {
    setFailure('')
    try {
      const { error } = await database()
        .from('todos')
        .update({ completed: !t.completed })
        .eq('id', t.id)
        .select()
        .single()
      check(error)
      await refresh()
    } catch (e) {
      setFailure(e instanceof Error ? e.message : isSi ? 'සුරැකීමට නොහැකි විය.' : 'Unable to save.')
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <ListTodo className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isSi ? 'මගේ කාර්යයන් සහ මතක් කිරීම්' : 'My Caregiver Tasks'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isSi
              ? 'සායනයට ගෙන යා යුතු ද්‍රව්‍ය සහ එදිනෙදා සත්කාරක කාර්යයන් කළමනාකරණය කරන්න.'
              : 'Keep track of clinic preparation items and daily care reminders.'}
          </p>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-muted-foreground">{isSi ? 'පූරණය වෙමින්…' : 'Loading…'}</p>}
      {(error || failure) && (
        <p role="alert" className="text-sm text-destructive font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
          {error || failure}
        </p>
      )}

      <form className="flex gap-2.5" onSubmit={add}>
        <Input
          name="title"
          aria-label={isSi ? 'නව කාර්යයක්' : 'New task'}
          placeholder={isSi ? 'උදා: CHDR පොත සහ එන්නත් කාඩ්පත සූදානම් කරගන්න...' : 'e.g., Pack CHDR book and clinic bag...'}
          required
          maxLength={500}
          className="rounded-xl bg-card border-border/80"
        />
        <Button type="submit" disabled={busy} className="btn-premium gap-1.5 shrink-0">
          <Plus className="size-4" />
          <span>{isSi ? 'එක් කරන්න' : 'Add'}</span>
        </Button>
      </form>

      <section className="glass-card rounded-2xl border p-5 space-y-3">
        {data?.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isSi ? 'තවමත් කාර්යයන් කිසිවක් නැත. ඉහතින් නව කාර්යයක් එක් කරන්න.' : 'No tasks yet. Add a new task above.'}
          </p>
        )}
        <ul className="space-y-2.5">
          {data?.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border/60 bg-card/60 transition-colors hover:border-primary/30"
            >
              <label className="flex items-center gap-3 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={t.completed}
                  onChange={() => void toggle(t)}
                  className="size-4 rounded border-border text-primary focus:ring-primary accent-primary"
                />
                <span className={`text-sm ${t.completed ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}`}>
                  {t.title}
                </span>
              </label>
              {t.completed && (
                <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200">
                  {isSi ? 'සම්පූර්ණයි' : 'Done'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

