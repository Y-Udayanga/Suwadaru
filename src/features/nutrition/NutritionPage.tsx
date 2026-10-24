import { AiChat } from "@/components/ai/AiChat"
import { useCallback, useState, type FormEvent } from 'react'
import { useLiveRecords } from '@/hooks/useLiveRecords'
import { nutritionService } from './nutritionService'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { useLanguage } from '@/hooks/useLanguage'
import { Salad, Sparkles, MessageSquare, Info, Send } from 'lucide-react'
import type { ChildFeaturePageProps } from '@/types'

const tables = ['nutrition_messages']

export function NutritionPage({ childId }: ChildFeaturePageProps) {
  const { language } = useLanguage()
  const isSi = language === 'si'
  const load = useCallback(() => nutritionService.list(childId), [childId])
  const { data, error, loading, refresh } = useLiveRecords(load, tables, childId)
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState('')
  const [noteText, setNoteText] = useState('')

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setFailure('')
    try {
      await nutritionService.add(childId, noteText)
      setNoteText('')
      await refresh()
    } catch (e) {
      setFailure(e instanceof Error ? e.message : isSi ? 'සටහන සුරැකීමට නොහැකි විය.' : 'Unable to save note.')
    } finally {
      setBusy(false)
    }
  }

  const samplePrompts = isSi
    ? [
        'මාස 6 දරුවාට මුල්ම අමතර ආහාර ලෙස දිය හැකි දේශීය කැඳ වර්ග මොනවාද?',
        'දරුවාට පරිප්පු සහ එළවළු හඳුන්වා දීමේදී සැලකිලිමත් විය යුතු කරුණු මොනවාද?',
        'කෑම හිරවීම (choking) වළක්වා ගැනීමට ආහාර කැබලි කළ යුතු ප්‍රමාණය?',
      ]
    : [
        'What local porridge recipes are suitable as first complementary foods at 6 months?',
        'How should I introduce dhal and cooked vegetables safely?',
        'What food textures help prevent choking during weaning?',
      ]

  return (
    <div className="max-w-4xl space-y-6 pb-12">
      <PageHeader
        title={isSi ? 'පෝෂණ සහ ආහාර සටහන්' : 'Nutrition & Feeding Notes'}
        subtitle={
          isSi
            ? 'සායනයට යාමට පෙර දරුවාගේ ආහාර පුරුදු, නිරීක්ෂණ සහ වෛද්‍යවරයාගෙන් ඇසිය යුතු ප්‍රශ්න සුරකින්න.'
            : 'Save feeding observations and questions for your next clinic visit.'
        }
      />

      <AiChat key={childId} title={isSi ? "සුවදරු AI පෝෂණ සහකාර" : "Nutrition AI assistant"} />

      {/* Safety notice banner */}
      <div className="rounded-xl border border-amber-300/80 bg-amber-50/70 p-4 text-xs sm:text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
        <div className="flex items-start gap-2.5">
          <Info className="size-4 shrink-0 text-amber-600 mt-0.5" />
          <p className="leading-relaxed">
            {isSi
              ? 'සුවදරු AI පෝෂණ මාර්ගෝපදේශය අධ්‍යාපනික සහායක් පමණි. සායනික ප්‍රතිකාර හෝ නිල ආහාර වේල් සැලසුම් සඳහා පවුල් සෞඛ්‍ය සේවා නිලධාරිනිය (PHM) හමුවන්න.'
              : 'AI advice is educational companion notes. Your notes are saved securely; always consult your Public Health Midwife or doctor for clinical nutrition guidance.'}
          </p>
        </div>
      </div>

      {loading && <p role="status" className="text-sm text-muted-foreground">{isSi ? 'සටහන් පූරණය වෙමින්…' : 'Loading notes…'}</p>}
      {error && (
        <div role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-destructive flex flex-wrap items-center justify-between gap-3 text-sm">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={() => void refresh()}>
            {isSi ? 'නැවත උත්සාහ කරන්න' : 'Retry'}
          </Button>
        </div>
      )}

      {/* Sample Question Chips */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="size-3 text-primary" />
          {isSi ? 'නිතර අසන ප්‍රශ්න සහ අදහස්:' : 'Suggested Questions & Notes:'}
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNoteText(prompt)}
              className="text-left text-xs bg-muted/70 hover:bg-muted border border-border/70 rounded-lg px-3 py-1.5 transition-colors text-foreground/90 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Note Composition Form */}
      <section className="glass-card rounded-2xl border p-5 sm:p-6 space-y-4">
        <form className="space-y-3" onSubmit={submit}>
          <label htmlFor="nutrition-note" className="block text-sm font-semibold text-foreground flex items-center gap-2">
            <Salad className="size-4 text-primary" />
            <span>{isSi ? 'නව පෝෂණ සටහනක් හෝ ප්‍රශ්නයක් ලියන්න' : 'New nutrition note or clinic question'}</span>
          </label>
          <textarea
            id="nutrition-note"
            name="body"
            required
            maxLength={8000}
            rows={4}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder={
              isSi
                ? 'උදාහරණයක් ලෙස: අද දරුවාට කෙසෙල් සහ බත් කැඳ දුන්නා, අසාත්මිකතා කිසිවක් නැත...'
                : 'Example: Started mashed avocado today, child accepted well with no rash...'
            }
            className="block w-full rounded-xl border border-input bg-card p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 leading-relaxed"
          />
          {failure && <p role="alert" className="text-xs text-destructive font-medium">{failure}</p>}
          <div className="flex justify-end">
            <Button disabled={busy} type="submit" className="btn-premium gap-2">
              <Send className="size-4" />
              <span>{busy ? (isSi ? 'සුරැකෙමින්…' : 'Saving…') : isSi ? 'සටහන සුරකින්න' : 'Save note'}</span>
            </Button>
          </div>
        </form>
      </section>

      {/* Saved Notes History */}
      <section className="glass-card rounded-2xl border p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <MessageSquare className="size-4 text-primary" />
          <span>{isSi ? 'සුරකින ලද පෝෂණ සටහන්' : 'Saved notes history'}</span>
        </h2>
        {data?.length === 0 && (
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isSi ? 'තවමත් කිසිදු සටහනක් සුරැකී නොමැත. ඉහතින් නව සටහනක් එක් කරන්න.' : 'No notes saved yet. Add your first note above.'}
          </p>
        )}
        <div className="space-y-3">
          {data?.map((n) => (
            <article key={n.id} className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-1.5 transition-colors hover:border-primary/30">
              <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">{n.body}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(n.created_at).toLocaleString()} · {n.sender === 'user' ? (isSi ? 'දෙමාපිය සටහන' : 'Caregiver note') : isSi ? 'සහකාර' : 'Assistant'}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}


