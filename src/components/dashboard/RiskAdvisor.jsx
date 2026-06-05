/**
 * RiskAdvisor — floating AI chat panel on the dashboard.
 *
 * Architecture
 * ────────────
 * All messages are sent to /api/chat, which is:
 *   • In production (Vercel): api/chat.js serverless function → Anthropic
 *   • In development: Vite plugin middleware in vite.config.js → Anthropic
 *
 * The system prompt injects the user's full live risk analysis so Claude
 * can give specific, data-driven answers.
 *
 * Props
 * ─────
 *   overallScore       number
 *   riskLevel          'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
 *   components         object  (from useRiskScore)
 *   topRisks           object[]
 *   enrichedBreakdown  object[]
 *   stats              object  (totalSuppliers, countries, commodities, totalSpend)
 *   matchedEvents      object[]
 *   hasData            boolean — false when no supplier file is loaded
 */
import { useState, useRef, useEffect, useCallback } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MESSAGES = 10

const STARTER_QUESTIONS = [
  "What's my biggest risk right now?",
  "What happens if I lose my China suppliers?",
  "How can I reduce my concentration risk?",
]

// ─── System prompt builder ────────────────────────────────────────────────────

function buildSystemPrompt({
  overallScore,
  riskLevel,
  components,
  topRisks,
  enrichedBreakdown,
  stats,
  matchedEvents,
}) {
  const riskSnapshot = {
    overallScore,
    riskLevel,
    componentScores: {
      geographic:   Math.round(components?.geographic?.score   ?? 0),
      countryRisk:  Math.round(components?.country?.score      ?? 0),
      disruptions:  Math.round(components?.disruption?.score   ?? 0),
      singleSource: Math.round(components?.singleSource?.score ?? 0),
    },
    geographicBreakdown: (enrichedBreakdown ?? []).slice(0, 8).map(r => ({
      country:    r.country,
      suppliers:  r.count,
      percentage: r.percentage,
      riskScore:  r.composite != null ? Math.round(r.composite) : null,
    })),
    singleSourceCategories: (
      components?.singleSource?.detail?.singleSourceCategories ?? []
    )
      .filter(c => c.supplierCount <= 2)
      .map(c => ({ category: c.category, supplierCount: c.supplierCount })),
    topRisks: (topRisks ?? []).slice(0, 5).map(r => ({
      title:          r.title,
      severity:       r.severity,
      type:           r.type,
      description:    r.description,
      recommendation: r.recommendation,
    })),
    matchedDisruptionEvents: (matchedEvents ?? []).slice(0, 6).map(e => ({
      title:     e.title,
      severity:  e.severity,
      countries: e.countries,
      date:      e.date,
    })),
    portfolioStats: {
      totalSuppliers: stats?.totalSuppliers,
      countries:      stats?.countries,
      commodities:    stats?.commodities,
      totalSpendUSD:  stats?.totalSpend ?? 0,
    },
  }

  return (
    `You are a supply chain risk advisor for SupplyLens. The user has uploaded their supplier data. ` +
    `Here is their current risk analysis:\n\n${JSON.stringify(riskSnapshot, null, 2)}\n\n` +
    `Answer their questions about their supply chain risk. ` +
    `Be concise (under 150 words), specific (reference their actual data), and actionable ` +
    `(give concrete next steps). Use plain language, not jargon.`
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Three animated dots shown while waiting for the API response */
function ThinkingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200 rounded-xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-3">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
        </div>
      </div>
    </div>
  )
}

/** A single chat bubble — user or advisor */
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={[
          'max-w-[88%] rounded-xl px-3 py-2 text-xs leading-relaxed',
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : msg.error
              ? 'bg-red-50 border border-red-200 text-slate-600 rounded-bl-sm'
              : 'bg-white border border-slate-200 text-slate-700 rounded-bl-sm shadow-sm',
        ].join(' ')}
      >
        {msg.content}
      </div>
    </div>
  )
}

/** Clickable starter-question chips, hidden after first send */
function StarterChips({ onSelect }) {
  return (
    <div className="py-2">
      <p className="text-[10px] text-slate-400 text-center mb-3 uppercase tracking-wide">
        Suggested questions
      </p>
      <div className="flex flex-col gap-2">
        {STARTER_QUESTIONS.map(q => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            className="text-left text-xs px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:border-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── RiskAdvisor ─────────────────────────────────────────────────────────────

export default function RiskAdvisor({
  overallScore,
  riskLevel,
  components,
  topRisks,
  enrichedBreakdown,
  stats,
  matchedEvents,
  hasData,
}) {
  const [open,         setOpen]         = useState(false)
  const [messages,     setMessages]     = useState([])   // { role, content, error? }
  const [input,        setInput]        = useState('')
  const [loading,      setLoading]      = useState(false)
  const [showStarters, setShowStarters] = useState(true)

  const bottomRef  = useRef(null)
  const inputRef   = useRef(null)
  const panelRef   = useRef(null)

  const atLimit = messages.length >= MAX_MESSAGES

  // Auto-scroll to newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  // Close on Escape key
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || loading || atLimit || !hasData) return

    const userMsg     = { role: 'user', content: trimmed }
    const nextHistory = [...messages, userMsg]

    setMessages(nextHistory)
    setInput('')
    setShowStarters(false)
    setLoading(true)

    try {
      const system = buildSystemPrompt({
        overallScore, riskLevel, components, topRisks,
        enrichedBreakdown, stats, matchedEvents,
      })

      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          model:      'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system,
          messages:   nextHistory,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error || `HTTP ${res.status}`)
      }

      const data    = await res.json()
      const content = data?.content?.[0]?.text

      if (!content) throw new Error('Empty response from API')

      setMessages(prev => [...prev, { role: 'assistant', content }])
    } catch (err) {
      console.error('[RiskAdvisor] API error:', err)
      setMessages(prev => [
        ...prev,
        {
          role:    'assistant',
          content: 'Advisor temporarily unavailable. Your risk analysis is still available on the dashboard.',
          error:   true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [
    loading, atLimit, hasData, messages,
    overallScore, riskLevel, components, topRisks,
    enrichedBreakdown, stats, matchedEvents,
  ])

  function handleSubmit(e) {
    e.preventDefault()
    sendMessage(input)
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Floating chat button ─────────────────────────────────────────────── */}
      <button
        type="button"
        aria-label={open ? 'Close Risk Advisor' : 'Open AI Risk Advisor'}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(v => !v)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-lg hover:shadow-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 flex items-center justify-center"
      >
        {/* Notification dot — shown when panel is closed and data is loaded */}
        {!open && hasData && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" aria-hidden />
        )}

        {open ? (
          /* X icon */
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden>
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        ) : (
          /* Chat bubble icon */
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5" aria-hidden>
            <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.311c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM7 8a1 1 0 11-2 0 1 1 0 012 0zm7 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {/* ── Slide-in panel ──────────────────────────────────────────────────── */}
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label="Risk Advisor"
          aria-modal="true"
          className={[
            'fixed z-50 bg-white shadow-2xl border border-slate-200 flex flex-col overflow-hidden',
            // Desktop: 400 px anchored above the button
            'sm:bottom-24 sm:right-6 sm:w-[400px] sm:max-h-[600px] sm:rounded-2xl',
            // Mobile: full-width sheet from the bottom
            'bottom-0 right-0 left-0 max-h-[85vh] rounded-t-2xl sm:left-auto',
          ].join(' ')}
        >
          {/* ── Panel header ── */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {/* Sparkle / advisor icon */}
                <svg viewBox="0 0 16 16" fill="white" className="w-4 h-4" aria-hidden>
                  <path d="M7.657 6.247c.11-.33.576-.33.686 0l.645 1.937a2.89 2.89 0 001.812 1.813l1.938.645c.33.11.33.576 0 .686l-1.938.645a2.89 2.89 0 00-1.812 1.812l-.645 1.938c-.11.33-.576.33-.686 0l-.645-1.937a2.89 2.89 0 00-1.812-1.813l-1.938-.645c-.33-.11-.33-.576 0-.686l1.938-.645a2.89 2.89 0 001.812-1.812l.645-1.938zM3.794 1.148a.217.217 0 01.412 0l.387 1.162c.173.518.579.924 1.097 1.097l1.162.387a.217.217 0 010 .412l-1.162.387A1.734 1.734 0 004.593 5.69l-.387 1.162a.217.217 0 01-.412 0L3.407 5.69A1.734 1.734 0 002.31 4.593l-1.162-.387a.217.217 0 010-.412l1.162-.387A1.734 1.734 0 003.407 2.31l.387-1.162zM10.863.099a.145.145 0 01.274 0l.258.774c.115.346.386.617.732.732l.774.258a.145.145 0 010 .274l-.774.258a1.156 1.156 0 00-.732.732l-.258.774a.145.145 0 01-.274 0l-.258-.774a1.156 1.156 0 00-.732-.732L9.1 2.137a.145.145 0 010-.274l.774-.258c.346-.115.617-.386.732-.732L10.863.1z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-white leading-none">Risk Advisor</p>
                <p className="text-[10px] text-blue-100 mt-0.5">Powered by Claude</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close Risk Advisor"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-100 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white"
            >
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
                <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z" />
              </svg>
            </button>
          </div>

          {/* ── Messages area ── */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0 scroll-smooth">

            {/* No data state */}
            {!hasData ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="text-4xl mb-3" aria-hidden>📊</div>
                <p className="text-sm font-semibold text-slate-700">No supplier data loaded</p>
                <p className="text-xs text-slate-400 mt-1.5 max-w-[200px] leading-relaxed">
                  Upload your supplier data first to get personalised risk advice.
                </p>
              </div>
            ) : (
              <>
                {/* Starters (hidden once first message is sent) */}
                {messages.length === 0 && showStarters && (
                  <StarterChips onSelect={sendMessage} />
                )}

                {/* Message history */}
                {messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} />
                ))}

                {/* Thinking indicator */}
                {loading && <ThinkingDots />}

                {/* Session limit notice */}
                {atLimit && !loading && (
                  <p className="text-[10px] text-slate-400 text-center py-2 border-t border-slate-100 mt-1">
                    Max {MAX_MESSAGES} messages reached · Start a new session for more questions
                  </p>
                )}

                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* ── Input bar ── */}
          {hasData && (
            <form
              onSubmit={handleSubmit}
              className="border-t border-slate-100 p-3 flex gap-2 items-end bg-slate-50/60 flex-shrink-0"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage(input)
                  }
                }}
                placeholder={
                  atLimit
                    ? 'Session limit reached'
                    : 'Ask about your supply chain risk…'
                }
                disabled={loading || atLimit}
                rows={1}
                aria-label="Message input"
                className="flex-1 resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
                style={{ maxHeight: 80, overflowY: 'auto' }}
              />

              {/* Send button */}
              <button
                type="submit"
                disabled={!input.trim() || loading || atLimit}
                aria-label="Send message"
                className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                {/* Up-arrow / send icon */}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
                  <path fillRule="evenodd" d="M8 1.5a.75.75 0 01.75.75v8.69l2.97-2.97a.75.75 0 011.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 9.03a.75.75 0 011.06-1.06L7.25 10.94V2.25A.75.75 0 018 1.5z" clipRule="evenodd" transform="rotate(180 8 8)" />
                </svg>
              </button>
            </form>
          )}
        </div>
      )}
    </>
  )
}
