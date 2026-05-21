/**
 * EventFeed — disruption event list with matched/all toggle and show-more.
 *
 * Props:
 *   suppliers   {object[]}  Supplier objects (each has a .country field — raw name or ISO3)
 *   allEvents   {object[]}  All events from events.json
 */
import { useState, useMemo } from 'react'
import EventCard from './EventCard'
import { normalizeCountry } from '../../utils/countryNormalizer'

const PAGE_SIZE = 10

// ─── EventFeed ────────────────────────────────────────────────────────────────

export default function EventFeed({ suppliers = [], allEvents = [] }) {
  const [showAll,    setShowAll]    = useState(false)   // matched vs all events
  const [showMore,   setShowMore]   = useState(false)   // expand beyond PAGE_SIZE

  // ── Build supplier ISO3 set and count-per-country map ────────────────────

  const { supplierISO3Set, supplierCountByISO3 } = useMemo(() => {
    const set = new Set()
    const map = {}
    for (const s of suppliers) {
      if (!s.country) continue
      const iso3 = normalizeCountry(s.country)
      if (!iso3) continue
      set.add(iso3)
      map[iso3] = (map[iso3] ?? 0) + 1
    }
    return { supplierISO3Set: set, supplierCountByISO3: map }
  }, [suppliers])

  // ── Sort all events newest-first ─────────────────────────────────────────

  const sortedEvents = useMemo(
    () => [...allEvents].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [allEvents],
  )

  // ── Tag each event as matched / not matched ───────────────────────────────

  const taggedEvents = useMemo(
    () =>
      sortedEvents.map(event => ({
        event,
        isMatched: (event.countries ?? []).some(iso3 => supplierISO3Set.has(iso3)),
      })),
    [sortedEvents, supplierISO3Set],
  )

  const matchedCount = taggedEvents.filter(t => t.isMatched).length

  // ── Filter based on toggle ────────────────────────────────────────────────

  const visibleTagged = showAll
    ? taggedEvents
    : taggedEvents.filter(t => t.isMatched)

  const displayedTagged = showMore
    ? visibleTagged
    : visibleTagged.slice(0, PAGE_SIZE)

  const hasMore = visibleTagged.length > PAGE_SIZE

  // ── No matched events state ───────────────────────────────────────────────

  const noMatches = matchedCount === 0 && !showAll

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-slate-900">Disruptions</h2>
          {matchedCount > 0 && (
            <span className="text-xs font-semibold text-white bg-red-500 rounded-full px-2 py-0.5 leading-none">
              {matchedCount}
            </span>
          )}
        </div>

        {/* Toggle */}
        <button
          type="button"
          onClick={() => { setShowAll(v => !v); setShowMore(false) }}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          aria-pressed={showAll}
        >
          {showAll ? 'Relevant only' : `Show all (${allEvents.length})`}
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 px-4 py-3">
        {/* No matches empty state */}
        {noMatches ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <span className="text-3xl mb-3" aria-hidden>✅</span>
            <p className="text-sm font-semibold text-slate-700">
              No recent disruptions affecting your supplier regions
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs">
              None of the {allEvents.length} tracked events match your supplier countries.
            </p>
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="mt-3 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Browse all events →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Section label when showing all */}
            {showAll && matchedCount > 0 && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 px-1 pb-1">
                Relevant to your suppliers
              </p>
            )}

            {displayedTagged.map(({ event, isMatched }) => (
              <EventCard
                key={event.id}
                event={event}
                supplierCountByISO3={supplierCountByISO3}
                isMatched={isMatched}
              />
            ))}

            {/* Show more / show less */}
            {hasMore && !showMore && (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="w-full mt-2 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors border border-dashed border-slate-200"
              >
                Show {visibleTagged.length - PAGE_SIZE} more event{visibleTagged.length - PAGE_SIZE !== 1 ? 's' : ''}
              </button>
            )}

            {showMore && visibleTagged.length > PAGE_SIZE && (
              <button
                type="button"
                onClick={() => setShowMore(false)}
                className="w-full mt-2 py-2 text-xs font-medium text-slate-400 hover:text-slate-600 transition-colors"
              >
                Show less ↑
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer — legend */}
      <div className="px-4 pb-4 pt-2 border-t border-slate-50 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-4 rounded-full bg-blue-500" />
          <span className="text-[10px] text-slate-400">Affects your suppliers</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1 h-4 rounded-full bg-slate-200" />
          <span className="text-[10px] text-slate-400">No overlap</span>
        </div>
      </div>
    </div>
  )
}
