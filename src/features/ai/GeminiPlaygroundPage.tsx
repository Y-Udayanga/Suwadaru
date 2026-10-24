import { useState } from 'react'
import {
  GEMINI_MODEL_LIST,
  generateContentWithAutoFlow,
  getGeminiApiKey,
  type ModelAttemptLog,
} from '@/services/gemini'

export function GeminiPlaygroundPage() {
  const [prompt, setPrompt] = useState(
    'Provide 3 nutritious, easily digestible breakfast ideas for a 1-year-old toddler using local Sri Lankan ingredients.'
  )
  const [response, setResponse] = useState<string | null>(null)
  const [activeModel, setActiveModel] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [attempts, setAttempts] = useState<ModelAttemptLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasApiKey = Boolean(getGeminiApiKey())

  async function handleGenerate() {
    if (!prompt.trim() || loading) return

    setLoading(true)
    setError(null)
    setResponse(null)
    setActiveModel(null)
    setLogs([])
    setAttempts([])

    const newLogs: string[] = []

    try {
      const result = await generateContentWithAutoFlow({
        prompt,
        onModelAttempt: (modelId, index) => {
          const log = `[#${index + 1}] Attempting ${modelId}...`
          newLogs.push(log)
          setLogs([...newLogs])
        },
        onAutoFlow: (failedModelId, reason, nextModelId) => {
          const log = `⚠️ [Auto-Flow] Model '${failedModelId}' unavailable (${reason}). Switching to '${nextModelId}'...`
          newLogs.push(log)
          setLogs([...newLogs])
        },
      })

      setActiveModel(result.modelUsed)
      setAttempts(result.attempts)
      setResponse(result.text)
      newLogs.push(`✅ Success: Response received from '${result.modelUsed}'!`)
      setLogs([...newLogs])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown generation failure'
      setError(msg)
      newLogs.push(`❌ Auto-flow finished with error.`)
      setLogs([...newLogs])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Gemini AI Auto-Flow Engine
            </h1>
            <p className="text-sm text-gray-500">
              Automatic fallback across 8 Gemini models when usage/quota is exhausted.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                hasApiKey
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {hasApiKey ? '● Gemini API Key Configured' : '○ API Key Missing in .env'}
            </span>
          </div>
        </div>

        {/* Models list */}
        <div className="pt-2">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Auto-Flow Priority Chain (1 to 8):
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            {GEMINI_MODEL_LIST.map((m, idx) => {
              const attempt = attempts.find((a) => a.modelId === m.id)
              let statusStyle = 'bg-gray-50 border-gray-200 text-gray-600'

              if (attempt?.success) {
                statusStyle = 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/20'
              } else if (attempt && !attempt.success) {
                statusStyle = 'bg-rose-50 border-rose-200 text-rose-700 opacity-70'
              }

              return (
                <div
                  key={m.id}
                  className={`p-2.5 rounded-lg border text-xs transition-all ${statusStyle}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{idx + 1}. {m.name}</span>
                    {attempt?.success && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Active</span>}
                    {attempt && !attempt.success && <span className="text-[10px] bg-rose-600 text-white px-1.5 py-0.5 rounded font-medium">Flowed</span>}
                  </div>
                  <p className="text-[11px] text-gray-500 line-clamp-1">{m.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Prompt input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label htmlFor="gemini-prompt" className="block text-sm font-semibold text-gray-700 mb-1">
            Prompt
          </label>
          <textarea
            id="gemini-prompt"
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question or prompt..."
            className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm outline-none transition-all"
          />
        </div>

        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  'What are key signs of nutritional deficiency in infants under 2 years?'
                )
              }
              className="text-xs text-teal-700 hover:text-teal-900 underline"
            >
              Preset: Infant Nutrition
            </button>
            <span className="text-gray-300">•</span>
            <button
              type="button"
              onClick={() =>
                setPrompt(
                  'Explain vaccination importance simply to an anxious caregiver.'
                )
              }
              className="text-xs text-teal-700 hover:text-teal-900 underline"
            >
              Preset: Vaccine Caregiver Tip
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || !hasApiKey}
            className="px-5 py-2.5 rounded-xl bg-teal-700 text-white font-medium text-sm hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin text-base">⟳</span>
                Auto-Flowing...
              </>
            ) : (
              'Run with Auto-Flow'
            )}
          </button>
        </div>

        {/* Real-time execution log */}
        {logs.length > 0 && (
          <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono space-y-1">
            <div className="text-slate-400 font-semibold mb-1 pb-1 border-b border-slate-800">
              Auto-Flow Logs:
            </div>
            {logs.map((log, i) => (
              <div key={i} className="leading-relaxed">
                {log}
              </div>
            ))}
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800 whitespace-pre-line">
            <strong className="block font-semibold mb-1">Execution Error:</strong>
            {error}
          </div>
        )}

        {/* Generated Output */}
        {response && (
          <div className="p-5 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs text-teal-800 pb-2 border-b border-teal-200/60">
              <span className="font-semibold">
                Generated Content (via {activeModel})
              </span>
              <span className="bg-teal-700 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                Success
              </span>
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
              {response}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default GeminiPlaygroundPage
