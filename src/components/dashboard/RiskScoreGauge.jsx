/**
 * RiskScoreGauge
 *
 * Props:
 *   overallScore  {number}  0–100 composite risk score
 *   riskLevel     {string}  'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
 *   components    {object}  from calculateOverallRisk().components
 *                           { geographic, country, disruption, singleSource }
 *                           each: { score: number, weight: number, detail: object }
 */

import { RISK_COLORS, RISK_THRESHOLDS } from '../../constants/riskThresholds'
import { getRiskLevel } from '../../utils/riskCalculations'

// ─── Design tokens ────────────────────────────────────────────────────────────

const GAUGE_SIZE   = 220          // SVG viewport dimension
const CX           = GAUGE_SIZE / 2
const CY           = GAUGE_SIZE / 2
const RADIUS       = 88           // arc radius
const TRACK_WIDTH  = 14           // stroke width of the arc track
const START_DEG    = 225          // arc start (clockwise from 12 o'clock)
const SWEEP_DEG    = 270          // total sweep angle

const RISK_BG = {
  LOW:      'bg-emerald-50',
  MODERATE: 'bg-amber-50',
  HIGH:     'bg-orange-50',
  CRITICAL: 'bg-red-50',
}

const RISK_RING = {
  LOW:      'ring-emerald-200',
  MODERATE: 'ring-amber-200',
  HIGH:     'ring-orange-200',
  CRITICAL: 'ring-red-200',
}

const RISK_TEXT = {
  LOW:      'text-emerald-600',
  MODERATE: 'text-amber-600',
  HIGH:     'text-orange-500',
  CRITICAL: 'text-red-600',
}

const RISK_LABEL_TEXT = {
  LOW:      'text-emerald-700',
  MODERATE: 'text-amber-700',
  HIGH:     'text-orange-600',
  CRITICAL: 'text-red-600',
}

const SUB_LABELS = {
  geographic:   'Geographic',
  country:      'Country Risk',
  disruption:   'Disruptions',
  singleSource: 'Single-Source',
}

// ─── SVG arc helper ───────────────────────────────────────────────────────────

/** Convert a clock-angle (0 = 12 o'clock, clockwise) to SVG {x, y}. */
function polarToXY(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

/**
 * Build an SVG arc path string.
 * @param {number} cx        Centre x
 * @param {number} cy        Centre y
 * @param {number} r         Radius
 * @param {number} startDeg  Start angle (0 = top, clockwise)
 * @param {number} endDeg    End angle
 */
function arcPath(cx, cy, r, startDeg, endDeg) {
  const start   = polarToXY(cx, cy, r, startDeg)
  const end     = polarToXY(cx, cy, r, endDeg)
  const sweep   = ((endDeg - startDeg) + 360) % 360
  const large   = sweep > 180 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
}

// ─── Gauge SVG ────────────────────────────────────────────────────────────────

function GaugeSVG({ score, riskLevel }) {
  const color     = RISK_COLORS[riskLevel]
  const fillRatio = Math.max(0, Math.min(score, 100)) / 100
  const endDeg    = START_DEG + fillRatio * SWEEP_DEG
  const trackEnd  = START_DEG + SWEEP_DEG        // 135 = 225+270-360

  const trackPath = arcPath(CX, CY, RADIUS, START_DEG, trackEnd)
  const fillPath  = fillRatio > 0
    ? arcPath(CX, CY, RADIUS, START_DEG, endDeg)
    : null

  // Tip dot at the leading edge of the fill arc
  const tip = fillRatio > 0 ? polarToXY(CX, CY, RADIUS, endDeg) : null

  return (
    <svg
      viewBox={`0 0 ${GAUGE_SIZE} ${GAUGE_SIZE}`}
      width={GAUGE_SIZE}
      height={GAUGE_SIZE}
      role="img"
      aria-label={`Risk score ${score} out of 100, level ${riskLevel}`}
      style={{ overflow: 'visible' }}
    >
      {/* Background track */}
      <path
        d={trackPath}
        fill="none"
        stroke="#E2E8F0"
        strokeWidth={TRACK_WIDTH}
        strokeLinecap="round"
      />

      {/* Coloured fill arc */}
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={TRACK_WIDTH}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      )}

      {/* Leading-edge dot */}
      {tip && (
        <circle
          cx={tip.x}
          cy={tip.y}
          r={TRACK_WIDTH / 2 + 1}
          fill={color}
        />
      )}

      {/* Score number */}
      <text
        x={CX}
        y={CY - 6}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={54}
        fontWeight="700"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#0F172A"
      >
        {score}
      </text>

      {/* "/100" sub-text */}
      <text
        x={CX}
        y={CY + 30}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={13}
        fontWeight="500"
        fontFamily="Inter, system-ui, sans-serif"
        fill="#94A3B8"
      >
        / 100
      </text>
    </svg>
  )
}

// ─── Sub-score pill ───────────────────────────────────────────────────────────

function SubScorePill({ label, score }) {
  const level = getRiskLevel(score)
  const dot = {
    LOW:      'bg-emerald-500',
    MODERATE: 'bg-amber-500',
    HIGH:     'bg-orange-500',
    CRITICAL: 'bg-red-500',
  }[level]

  return (
    <div className="flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100 min-w-[90px]">
      <div className="flex items-center gap-1.5">
        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden />
        <span className="text-xs font-medium text-slate-500 whitespace-nowrap">{label}</span>
      </div>
      <span
        className="text-xl font-bold"
        style={{ color: RISK_COLORS[level] }}
      >
        {score}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: RISK_COLORS[level] }}>
        {level}
      </span>
    </div>
  )
}

// ─── RiskScoreGauge ───────────────────────────────────────────────────────────

export default function RiskScoreGauge({ overallScore = 0, riskLevel = 'LOW', components = {} }) {
  const subScores = [
    { key: 'geographic',   label: SUB_LABELS.geographic },
    { key: 'country',      label: SUB_LABELS.country },
    { key: 'disruption',   label: SUB_LABELS.disruption },
    { key: 'singleSource', label: SUB_LABELS.singleSource },
  ]

  return (
    <div className={`
      bg-white rounded-xl border border-slate-200 shadow-sm p-6
      flex flex-col items-center text-center
    `}>
      {/* Card header */}
      <h2 className="text-base font-semibold text-slate-900 self-start w-full mb-6">
        Overall Risk Score
      </h2>

      {/* Gauge circle — coloured ring around the SVG */}
      <div className={`
        rounded-full p-3 ring-4
        ${RISK_BG[riskLevel]} ${RISK_RING[riskLevel]}
      `}>
        <GaugeSVG score={overallScore} riskLevel={riskLevel} />
      </div>

      {/* Risk level label */}
      <div className="mt-4 flex flex-col items-center gap-1">
        <span
          className={`
            px-4 py-1 rounded-full text-sm font-bold tracking-wide uppercase
            ${RISK_BG[riskLevel]} ${RISK_LABEL_TEXT[riskLevel]}
            ring-1 ${RISK_RING[riskLevel]}
          `}
        >
          {riskLevel}
        </span>
        <p className="text-xs text-slate-400 mt-1">
          Composite supply chain risk
        </p>
      </div>

      {/* Divider */}
      <div className="w-full border-t border-slate-100 my-5" />

      {/* Sub-score pills */}
      <div className="flex flex-wrap justify-center gap-2 w-full">
        {subScores.map(({ key, label }) => {
          const score = components[key]?.score ?? 0
          return <SubScorePill key={key} label={label} score={score} />
        })}
      </div>

      {/* Weight breakdown footnote */}
      <p className="mt-4 text-[11px] text-slate-300 leading-relaxed">
        35% Geographic · 30% Country · 20% Disruption · 15% Single-Source
      </p>
    </div>
  )
}
