/**
 * EventFeed — disruption event timeline (Phase 4 placeholder).
 *
 * Props:
 *   events   Array of matched events from calculateDisruptionScore()
 *            each: { id, date, title, description, countries, type,
 *                    severity, daysAgo, contribution }
 */

const SEVERITY_STYLE = {
  critical: { dot: 'bg-red-500',    text: 'text-red-700',    label: 'Critical' },
  high:     { dot: 'bg-orange-500', text: 'text-orange-700', label: 'High'     },
  medium:   { dot: 'bg-amber-500',  text: 'text-amber-700',  label: 'Medium'   },
  low:      { dot: 'bg-slate-400',  text: 'text-slate-600',  label: 'Low'      },
}

function timeAgo(daysAgo) {
  if (daysAgo === 0) return 'Today'
  if (daysAgo === 1) return 'Yesterday'
  if (daysAgo < 7)  return `${daysAgo}d ago`
  if (daysAgo < 30) return `${Math.floor(daysAgo / 7)}w ago`
  if (daysAgo < 365) return `${Math.floor(daysAgo / 30)}mo ago`
  return `${Math.floor(daysAgo / 365)}y ago`
}

function EventRow({ event }) {
  const s = SEVERITY_STYLE[event.severity] ?? SEVERITY_STYLE.low

  return (
    <li className="flex gap-3 group">
      {/* Timeline dot + line */}
      <div className="flex flex-col items-center shrink-0 pt-1">
        <span className={`w-2.5 h-2.5 rounded-full ${s.dot} ring-2 ring-white shrink-0`} aria-hidden />
        <span className="w-px flex-1 bg-slate-100 mt-1 group-last:hidden" aria-hidden />
      </div>

      {/* Content */}
      <div className="pb-4 min-w-0">
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <p className="text-xs font-semibold text-slate-800 leading-snug">{event.title}</p>
          <span className="text-[11px] text-slate-400 shrink-0 whitespace-nowrap">
            {timeAgo(event.daysAgo)}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500 leading-relaxed line-clamp-2">
          {event.description}
        </p>
        <div className="mt-1.5 flex items-center gap-2">
          <span className={`text-[10px] font-semibold uppercase tracking-wide ${s.text}`}>
            {s.label}
          </span>
          <span className="text-slate-200 text-xs">·</span>
          <span className="text-[10px] text-slate-400 capitalize">
            {event.type?.replace(/_/g, ' ')}
          </span>
          <span className="text-slate-200 text-xs">·</span>
          <span className="text-[10px] text-slate-400">
            +{event.contribution} pts
          </span>
        </div>
      </div>
    </li>
  )
}

export default function EventFeed({ events = [] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-slate-400" aria-hidden>
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-600">No matched disruptions</p>
        <p className="text-xs text-slate-400 mt-1">
          No active events affect your supplier countries.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">Active Disruptions</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
          {events.length}
        </span>
      </div>

      <ul className="list-none" aria-label="Disruption event feed">
        {events.slice(0, 8).map(event => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>

      {events.length > 8 && (
        <p className="mt-2 text-xs text-slate-400 text-center">
          +{events.length - 8} more events affect your supply chain
        </p>
      )}
    </div>
  )
}
