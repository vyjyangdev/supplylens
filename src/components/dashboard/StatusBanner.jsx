/**
 * StatusBanner — full-width contextual strip at the top of the dashboard.
 *
 * Props:
 *   riskLevel   'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
 *   topRisks    array from generateTopRisks() — used for the count
 */

const CONFIG = {
  LOW: {
    bg:      'bg-emerald-50  border-emerald-200',
    icon:    'text-emerald-500',
    heading: 'text-emerald-900',
    body:    'text-emerald-700',
    emoji:   '✅',
    title:   'Supply chain looks healthy',
    message: (n) =>
      n === 0
        ? 'No significant risks detected. Continue monitoring for new disruptions.'
        : `${n} item${n !== 1 ? 's' : ''} worth watching — no immediate action required.`,
  },
  MODERATE: {
    bg:      'bg-amber-50  border-amber-200',
    icon:    'text-amber-500',
    heading: 'text-amber-900',
    body:    'text-amber-700',
    emoji:   '🟡',
    title:   (n) => `${n} risk${n !== 1 ? 's' : ''} to watch`,
    message: () =>
      'Review the findings below and consider proactive mitigation steps.',
  },
  HIGH: {
    bg:      'bg-orange-50  border-orange-200',
    icon:    'text-orange-500',
    heading: 'text-orange-900',
    body:    'text-orange-700',
    emoji:   '🟠',
    title:   (n) => `Action recommended — ${n} significant risk${n !== 1 ? 's' : ''} identified`,
    message: () =>
      'Your supply chain has meaningful exposure. Review each finding and initiate mitigation planning.',
  },
  CRITICAL: {
    bg:      'bg-red-50  border-red-200',
    icon:    'text-red-500',
    heading: 'text-red-900',
    body:    'text-red-700',
    emoji:   '🔴',
    title:   (n) => `Action needed — ${n} critical vulnerabilit${n !== 1 ? 'ies' : 'y'} detected`,
    message: () =>
      'Immediate attention required. Escalate to procurement leadership and activate contingency plans.',
  },
}

export default function StatusBanner({ riskLevel = 'LOW', topRisks = [] }) {
  const cfg = CONFIG[riskLevel] ?? CONFIG.LOW
  const n   = topRisks.length

  const title   = typeof cfg.title   === 'function' ? cfg.title(n)   : cfg.title
  const message = typeof cfg.message === 'function' ? cfg.message(n) : cfg.message

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex items-start gap-3 rounded-xl border px-5 py-4 ${cfg.bg}`}
    >
      {/* Emoji icon */}
      <span className="text-xl leading-none mt-0.5 shrink-0" aria-hidden>
        {cfg.emoji}
      </span>

      <div className="min-w-0">
        <p className={`text-sm font-bold ${cfg.heading}`}>{title}</p>
        <p className={`text-sm mt-0.5 ${cfg.body}`}>{message}</p>
      </div>
    </div>
  )
}
