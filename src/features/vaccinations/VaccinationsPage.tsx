import { useCallback, useState, type FormEvent } from 'react'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { vaccinationService } from './vaccinationService'
import { database, check } from '@/services/health'
import { useChild } from '@/features/children'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useLanguage } from '@/hooks/useLanguage'
import { Syringe, CheckCircle2, AlertCircle, Clock } from 'lucide-react'
import type { ChildFeaturePageProps } from '@/types'

const tables = ['vaccination_records', 'vaccination_schedule', 'children']

export function VaccinationsPage({ childId }: ChildFeaturePageProps) {
  const { language } = useLanguage()
  const isSi = language === 'si'
  const { children } = useChild()
  const child = children.find((c) => c.id === childId)

  const load = useCallback(
    async () => ({
      records: await vaccinationService.getRecords(childId),
      schedule: await vaccinationService.getSchedule(childId),
    }),
    [childId]
  )

  const { data, error, loading, refresh } = useLiveRecords(load, tables)
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const f = new FormData(form)
    setBusy(true)
    setFailure('')
    try {
      if (editing) {
        const { error } = await database()
          .from('vaccination_records')
          .update({ administered_on: String(f.get('date')) })
          .eq('id', editing)
          .select()
          .single()
        check(error)
      } else {
        await vaccinationService.addReportedDose({
          childId,
          vaccineCode: String(f.get('vaccine')),
          administeredOn: String(f.get('date')),
        })
      }
      setEditing(null)
      form.reset()
      await refresh()
    } catch (e) {
      setFailure(e instanceof Error ? e.message : isSi ? 'සුරැකීමට නොහැකි විය.' : 'Unable to save.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <PageHeader
        title={isSi ? 'ප්‍රතිශක්තිකරණ එන්නත්' : 'Vaccinations'}
        subtitle={
          child?.name
            ? isSi
              ? `${child.name} ගේ එන්නත් සටහන්`
              : `${child.name}'s vaccination history`
            : undefined
        }
      />

      <div className="rounded-xl border border-rose-200/60 bg-rose-50/50 p-4 text-xs sm:text-sm text-foreground/80 dark:border-rose-900/40 dark:bg-rose-950/20">
        <p className="flex items-start gap-2">
          <AlertCircle className="size-4 shrink-0 text-primary mt-0.5" />
          <span>
            {isSi
              ? 'ඔබේ දරුවාගේ ළමා සෞඛ්‍ය සංවර්ධන වාර්තාවෙන් (CHDR පොත) ලබාගත් එන්නත් මාත්‍රා සටහන් කරන්න. මෙම සටහන් දෙමාපියන් විසින් ඇතුළත් කරන ලද ඒවා බැවින් තහවුරු නොකළ ලෙස දැක්වේ.'
              : 'Record doses from your child’s health record. Entries are parent-reported and unverified.'}
          </span>
        </p>
      </div>

      {loading && <p role="status" className="text-sm text-muted-foreground">{isSi ? 'වාර්තා පූරණය වෙමින්…' : 'Loading records…'}</p>}
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            {isSi ? 'නැවත උත්සාහ කරන්න' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Add / Edit Form */}
      <section className="glass-card rounded-2xl border p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2.5 text-base font-semibold text-foreground">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Syringe className="size-4" />
          </div>
          <h2>
            {editing
              ? isSi
                ? 'එන්නත් ලබාදුන් දිනය නිවැරදි කිරීම'
                : 'Correct dose date'
              : isSi
              ? 'ලබාදුන් එන්නතක් සටහන් කරන්න'
              : 'Add reported dose'}
          </h2>
        </div>

        <form key={editing ?? 'new'} onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-1.5 text-xs sm:text-sm font-medium text-foreground">
            <span>{isSi ? 'එන්නත සහ මාත්‍රාව' : 'Vaccine and dose'}</span>
            <Input
              name="vaccine"
              maxLength={120}
              required
              disabled={!!editing}
              defaultValue={data?.records.find((r) => r.id === editing)?.vaccineCode}
              placeholder={isSi ? 'CHDR පොතේ ලියා ඇති පරිදි' : 'As written on the health record'}
              className="mt-1"
            />
          </label>

          <label className="space-y-1.5 text-xs sm:text-sm font-medium text-foreground">
            <span>{isSi ? 'ලබාදුන් දිනය' : 'Date given'}</span>
            <Input
              name="date"
              type="date"
              min={child?.dateOfBirth}
              required
              defaultValue={data?.records.find((r) => r.id === editing)?.administeredOn ?? ''}
              className="mt-1"
            />
          </label>

          {failure && (
            <p role="alert" className="sm:col-span-2 text-xs text-destructive font-medium">
              {failure}
            </p>
          )}

          <div className="sm:col-span-2 flex items-center gap-3 pt-2">
            <Button type="submit" disabled={busy} className="btn-premium">
              {busy
                ? isSi
                  ? 'සුරැකෙමින්…'
                  : 'Saving…'
                : isSi
                ? 'මාත්‍රාව සුරකින්න'
                : 'Save dose'}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                {isSi ? 'අවලංගු කරන්න' : 'Cancel edit'}
              </Button>
            )}
          </div>
        </form>
      </section>

      {/* Recorded Doses */}
      <section className="glass-card rounded-2xl border p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>{isSi ? 'සටහන් කළ එන්නත් මාත්‍රා' : 'Recorded doses'}</span>
        </h2>
        {data?.records.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isSi ? 'තවමත් එන්නත් මාත්‍රා සටහන් කර නොමැත.' : 'No doses recorded yet.'}
          </p>
        )}
        <ul className="divide-y divide-border/60">
          {data?.records.map((r) => (
            <li key={r.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <strong className="text-sm font-semibold text-foreground">{r.vaccineCode}</strong>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {r.administeredOn} · {isSi ? 'දෙමාපියන් සටහන් කළ' : 'Parent-reported'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setEditing(r.id)}>
                {isSi ? 'දිනය වෙනස් කරන්න' : 'Correct date'}
              </Button>
            </li>
          ))}
        </ul>
      </section>

      {/* Schedule Milestones */}
      <section className="glass-card rounded-2xl border p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Clock className="size-4 text-primary" />
          <span>{isSi ? 'නිල ජාතික කාලසටහන් සන්ධිස්ථාන (EPI)' : 'Schedule milestones'}</span>
        </h2>
        {data?.schedule.length === 0 ? (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isSi
              ? 'නිල කාලසටහනක් පළ කර නොමැත. දරුවාගේ සෞඛ්‍ය වාර්තාව බලන්න හෝ දිනයන් සඳහා ඔබේ සායනයෙන් විමසන්න.'
              : 'No reviewed schedule has been published. Check the child’s health record or ask your clinic for due dates.'}
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {data?.schedule.map((m) => (
              <li key={m.id} className="py-2.5 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-sm font-medium text-foreground">
                  {m.vaccineName} · <span className="text-primary font-semibold">{m.dueDate}</span>
                </span>
                <a
                  href={m.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  {isSi ? 'මූලාශ්‍රය' : 'Source'} ({m.scheduleVersion})
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

