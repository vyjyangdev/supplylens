/**
 * EventCard — compact disruption event card (~80px tall).
 *
 * Props:
 *   event                {object}  event from events.json + optional daysAgo
 *   supplierCountByISO3  {object}  { CHN: 18, TWN: 6, … } — pre-computed from suppliers
 *   isMatched            {boolean} true if event affects ≥1 supplier country
 */

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  geopolitical:     { emoji: '🌐', label: 'Geopolitical', bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200' },
  natural_disaster: { emoji: '🌊', label: 'Natural',      bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200'   },
  trade_policy:     { emoji: '📜', label: 'Trade Policy', bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200' },
  labor:            { emoji: '👷', label: 'Labor',        bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200' },
  infrastructure:   { emoji: '🏗️', label: 'Infra',       bg: 'bg-slate-100',  text: 'text-slate-600',   border: 'border-slate-200'  },
  regulatory:       { emoji: '⚖️', label: 'Regulatory',  bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200'   },
}

const DEFAULT_TYPE = { emoji: '📌', label: 'Event', bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }

// ─── Severity config ──────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  critical: { bg: 'bg-red-100',    text: 'text-red-700',    label: 'Critical' },
  high:     { bg: 'bg-orange-100', text: 'text-orange-700', label: 'High'     },
  medium:   { bg: 'bg-amber-100',  text: 'text-amber-700',  label: 'Medium'   },
  low:      { bg: 'bg-slate-100',  text: 'text-slate-500',  label: 'Low'      },
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "2025-04-07" → "Apr 7, 2025" */
function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

/** ISO3 → display name lookup built from country-metadata at build time */
import countryMetadata from '../../data/country-metadata.json'
const ISO3_TO_NAME = Object.fromEntries(countryMetadata.map(c => [c.iso3, c.name]))

/**
 * Build the "Affects X of your suppliers in …" string.
 * Returns null if event doesn't overlap with any supplier country.
 */
function buildAffectsLabel(eventCountries, supplierCountByISO3) {
  const hits = (eventCountries ?? [])
    .filter(iso3 => supplierCountByISO3[iso3] > 0)
    .sort((a, b) => (supplierCountByISO3[b] ?? 0) - (supplierCountByISO3[a] ?? 0))

  if (hits.length === 0) return null

  const total = hits.reduce((sum, iso3) => sum + (supplierCountByISO3[iso3] ?? 0), 0)

  if (hits.length === 1) {
    return `Affects ${total} of your supplier${total !== 1 ? 's' : ''} in ${ISO3_TO_NAME[hits[0]] ?? hits[0]}`
  }

  // Multiple countries — show top 2 by name, then "+N more" if needed
  const named = hits.slice(0, 2).map(iso3 => ISO3_TO_NAME[iso3] ?? iso3)
  const extra = hits.length - 2
  const countryStr = extra > 0 ? `${named.join(', ')} +${extra} more` : named.join(' & ')
  return `Affects ${total} of your suppliers across ${countryStr}`
}

// ─── EventCard ────────────────────────────────────────────────────────────────

export default function EventCard({ event, supplierCountByISO3 = {}, isMatched = false }) {
  const tc  = TYPE_CONFIG[event.type] ?? DEFAULT_TYPE
  const sc  = SEVERITY_CONFIG[event.severity] ?? SEVERITY_CONFIG.low
  const affectsLabel = isMatched
    ? buildAffectsLabel(event.countries, supplierCountByISO3)
    : null

  return (
    <article
      className={[
        'relative pl-3 pr-3 py-2.5 rounded-lg border-l-4 border border-slate-100',
        'transition-colors',
        isMatched
          ? 'border-l-blue-500 bg-blue-50/40 hover:bg-blue-50/70'
          : 'border-l-slate-200 bg-white hover:bg-slate-50 opacity-70',
      ].join(' ')}
      aria-label={`${event.title} — ${sc.label} severity`}
    >
      {/* Row 1: type tag + title + date */}
      <div className="flex items-start gap-2">
        {/* Type tag */}
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 mt-px ${tc.bg} ${tc.text}`}
          title={tc.label}
        >
          <span aria-hidden>{tc.emoji}</span>
          <span className="hidden sm:inline">{tc.label}</span>
        </span>

        {/* Title */}
        <p className="flex-1 text-xs font-semibold text-slate-800 leading-snug line-clamp-2 min-w-0">
          {event.title}
        </p>

        {/* Date */}
        <span className="text-[10px] text-slate-400 shrink-0 whitespace-nowrap mt-px">
          {formatDate(event.date)}
        </span>
      </div>

      {/* Row 2: severity badge + affects label + source */}
      <div className="mt-1.5 flex items-center gap-2 flex-wrap">
        {/* Severity badge */}
        <span className={`inline-block px-1.5 py-px rounded text-[10px] font-bold uppercase tracking-wide ${sc.bg} ${sc.text}`}>
          {sc.label}
        </span>

        {/* Affects label (matched events only) */}
        {affectsLabel && (
          <>
            <span className="text-slate-200 text-xs" aria-hidden>·</span>
            <span className="text-[10px] font-medium text-blue-700 leading-none">
              {affectsLabel}
            </span>
          </>
        )}

        {/* Source — pushed to the right */}
        {event.source && (
          <span className="ml-auto text-[10px] text-slate-300 italic shrink-0 leading-none">
            {event.source}
          </span>
        )}
      </div>
    </article>
  )
}
