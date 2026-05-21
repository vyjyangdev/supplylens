/**
 * TopRisks — panel showing 3–5 prioritised risk findings with recommendations.
 *
 * Props:
 *   risks   Array from generateTopRisks() — each item:
 *           { type, severity, title, description, recommendation }
 */
import { useState } from 'react'
import RiskBadge from '../common/RiskBadge'

// ─── Type icons (inline SVG, no extra deps) ───────────────────────────────────

const TYPE_ICONS = {
  geographic: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path fillRule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clipRule="evenodd" />
    </svg>
  ),
  single_source: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M10 1a6 6 0 00-3.815 10.631C7.237 12.5 8 13.443 8 14.456v.644a.75.75 0 00.572.729 6.016 6.016 0 002.856 0A.75.75 0 0012 15.1v-.644c0-1.013.762-1.957 1.815-2.825A6 6 0 0010 1zM8.863 17.414a.75.75 0 00-.226 1.483 9.066 9.066 0 002.726 0 .75.75 0 00-.226-1.483 7.553 7.553 0 01-2.274 0z" />
    </svg>
  ),
  disruption: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
    </svg>
  ),
  country_risk: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden>
      <path d="M3.105 2.288a.75.75 0 00-.826.95l1.414 4.926A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.897 28.897 0 0015.293-7.155.75.75 0 000-1.114A28.897 28.897 0 003.105 2.288z" />
    </svg>
  ),
}

const ICON_BG = {
  LOW:      'bg-emerald-100 text-emerald-600',
  MODERATE: 'bg-amber-100   text-amber-600',
  HIGH:     'bg-orange-100  text-orange-600',
  CRITICAL: 'bg-red-100     text-red-600',
}

// ─── Single risk card ─────────────────────────────────────────────────────────

function RiskCard({ risk, index }) {
  const [expanded, setExpanded] = useState(false)
  const icon    = TYPE_ICONS[risk.type] ?? TYPE_ICONS.disruption
  const iconBg  = ICON_BG[risk.severity] ?? ICON_BG.MODERATE

  return (
    <article className="border border-slate-100 rounded-xl p-4 hover:border-slate-200 transition-colors">
      {/* Card header */}
      <div className="flex items-start gap-3">
        {/* Numbered icon */}
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          {/* Severity + type */}
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <RiskBadge level={risk.severity} />
            <span className="text-xs text-slate-400 capitalize">
              {risk.type.replace(/_/g, ' ')}
            </span>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-900 leading-snug">
            {risk.title}
          </h3>
        </div>

        {/* Rank number */}
        <span className="text-xs font-bold text-slate-300 shrink-0 mt-0.5">
          #{index + 1}
        </span>
      </div>

      {/* Description */}
      <p className="mt-3 text-xs text-slate-600 leading-relaxed line-clamp-3">
        {risk.description}
      </p>

      {/* Expand / collapse recommendation */}
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
        aria-expanded={expanded}
      >
        <svg
          viewBox="0 0 16 16"
          fill="currentColor"
          className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
          aria-hidden
        >
          <path fillRule="evenodd" d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06L7.28 11.78a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z" clipRule="evenodd" />
        </svg>
        {expanded ? 'Hide recommendation' : 'View recommendation'}
      </button>

      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wide mb-1.5">
            Recommended action
          </p>
          <p className="text-xs text-slate-700 leading-relaxed">
            {risk.recommendation}
          </p>
        </div>
      )}
    </article>
  )
}

// ─── TopRisks panel ───────────────────────────────────────────────────────────

export default function TopRisks({ risks = [] }) {
  if (risks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-emerald-600" aria-hidden>
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700">No significant risks detected</p>
        <p className="text-xs text-slate-400 mt-1">Your supply chain concentration looks healthy.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-semibold text-slate-900">Top Risks</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-100 rounded-full px-2.5 py-0.5">
          {risks.length}
        </span>
      </div>

      <div className="space-y-3">
        {risks.map((risk, i) => (
          <RiskCard key={i} risk={risk} index={i} />
        ))}
      </div>
    </div>
  )
}
