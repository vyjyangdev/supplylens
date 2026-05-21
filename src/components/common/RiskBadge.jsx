/**
 * RiskBadge — colour-coded severity pill.
 *
 * Props:
 *   level   'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
 *   size    'sm' (default) | 'md'
 */
const STYLES = {
  LOW:      { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  MODERATE: { bg: 'bg-amber-100',   text: 'text-amber-700',   dot: 'bg-amber-500'   },
  HIGH:     { bg: 'bg-orange-100',  text: 'text-orange-700',  dot: 'bg-orange-500'  },
  CRITICAL: { bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
}

export default function RiskBadge({ level = 'LOW', size = 'sm' }) {
  const s    = STYLES[level] ?? STYLES.LOW
  const text = size === 'md'
    ? 'text-sm px-2.5 py-1 gap-2'
    : 'text-xs px-2 py-0.5 gap-1.5'

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wide ${s.bg} ${s.text} ${text}`}
      aria-label={`Risk level: ${level}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} aria-hidden />
      {level}
    </span>
  )
}
