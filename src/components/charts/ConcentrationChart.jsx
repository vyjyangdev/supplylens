/**
 * ConcentrationChart
 *
 * Props:
 *   breakdown       {Array}  [{country, count, percentage, composite}] sorted desc by count
 *   hhi             {number} Geographic concentration score 0–100
 *   totalSuppliers  {number}
 */

import {
  BarChart, Bar, XAxis, YAxis, Cell,
  Tooltip as RechartsTooltip, ResponsiveContainer, LabelList,
} from 'recharts'
import { getRiskLevel } from '../../utils/riskCalculations'
import { RISK_COLORS, RISK_THRESHOLDS } from '../../constants/riskThresholds'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map a composite country risk score to a hex fill colour. */
function riskColor(composite) {
  if (composite == null) return '#94A3B8'         // slate-400 — unknown
  if (composite >= RISK_THRESHOLDS.CRITICAL) return RISK_COLORS.CRITICAL
  if (composite >= RISK_THRESHOLDS.HIGH)     return RISK_COLORS.HIGH
  if (composite >= RISK_THRESHOLDS.MODERATE) return RISK_COLORS.MODERATE
  return RISK_COLORS.LOW
}

/** HHI label colour */
function hhiLabelColor(hhi) {
  if (hhi >= RISK_THRESHOLDS.CRITICAL) return 'text-red-600'
  if (hhi >= RISK_THRESHOLDS.HIGH)     return 'text-orange-500'
  if (hhi >= RISK_THRESHOLDS.MODERATE) return 'text-amber-500'
  return 'text-emerald-600'
}

// ─── Custom Y-axis tick (country name) ───────────────────────────────────────
// Using a function component avoids Recharts v3 clipping issues with the
// default tick renderer when left margin is 0.

function CountryTick({ x, y, payload }) {
  if (!payload?.value) return null
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="#475569"
      fontSize={12}
      fontWeight={500}
      fontFamily="Inter, system-ui, sans-serif"
    >
      {payload.value}
    </text>
  )
}

// ─── Custom bar label ─────────────────────────────────────────────────────────

function BarValueLabel({ x, y, width, height, value }) {
  if (!value) return null
  return (
    <text
      x={x + width + 6}
      y={y + height / 2 + 1}
      fill="#64748B"
      fontSize={11}
      dominantBaseline="middle"
      fontFamily="Inter, system-ui, sans-serif"
    >
      {value}
    </text>
  )
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload ?? {}
  const level = d.composite != null ? getRiskLevel(d.composite) : null
  const badgeColors = {
    LOW:      'bg-emerald-100 text-emerald-700',
    MODERATE: 'bg-amber-100   text-amber-700',
    HIGH:     'bg-orange-100  text-orange-700',
    CRITICAL: 'bg-red-100     text-red-700',
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-lg p-3 text-xs min-w-[160px]">
      <p className="font-semibold text-slate-900 text-sm mb-2">{d.country}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Suppliers</span>
          <span className="font-medium text-slate-900">{d.count}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Share</span>
          <span className="font-medium text-slate-900">{d.percentage}%</span>
        </div>
        {d.composite != null && (
          <div className="flex justify-between gap-4 items-center pt-1 mt-1 border-t border-slate-100">
            <span className="text-slate-500">Country risk</span>
            <span className="font-medium text-slate-900">{d.composite.toFixed(1)}/100</span>
          </div>
        )}
        {level && (
          <div className="pt-1">
            <span className={`px-2 py-0.5 rounded-full font-semibold ${badgeColors[level]}`}>
              {level}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ConcentrationChart ───────────────────────────────────────────────────────

export default function ConcentrationChart({ breakdown = [], hhi = 0, totalSuppliers = 0 }) {
  // Top 8 countries, build chart-ready data
  const chartData = breakdown.slice(0, 8).map(row => ({
    country:    row.country,
    count:      row.count,
    percentage: row.percentage,
    composite:  row.composite ?? null,
    label:      `${row.count} (${row.percentage}%)`,
  }))

  // Concentration level for HHI badge
  const hhiLevel = getRiskLevel(hhi)
  const hhiColor = hhiLabelColor(hhi)

  // Warning callout — any country with > 30% share
  const highShareCountry = breakdown.find(r => r.percentage > 30)

  // Dynamic bar height so chart doesn't look sparse for few countries
  const barSize  = 28
  const chartH   = Math.max(180, chartData.length * (barSize + 12))
  // Right margin large enough for "18 (36%)" labels
  const rightMargin = 72
  // Left margin prevents the SVG from clipping the first few px of tick text
  const leftMargin = 4

  if (breakdown.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Country Concentration</h2>
        <p className="text-sm text-slate-400 text-center py-8">No supplier data loaded.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Country Concentration</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Top {chartData.length} countries · {totalSuppliers} suppliers total
          </p>
        </div>

        {/* HHI badge */}
        <div className="text-right shrink-0">
          <p className="text-xs text-slate-500 mb-0.5">Concentration Index</p>
          <p className={`text-lg font-bold ${hhiColor}`}>
            {hhi.toFixed(0)}<span className="text-sm font-normal text-slate-400">/100</span>
          </p>
          <p className={`text-xs font-semibold ${hhiColor}`}>{hhiLevel}</p>
        </div>
      </div>

      {/* ⚠ Callout */}
      {highShareCountry && (
        <div className="mb-4 flex items-start gap-2 px-3 py-2.5 rounded-lg bg-amber-50 border border-amber-200">
          <span className="text-amber-500 text-base leading-none mt-px" aria-hidden>⚠</span>
          <p className="text-xs text-amber-800 font-medium">
            <strong>{highShareCountry.country}</strong> represents{' '}
            <strong>{highShareCountry.percentage}%</strong> of your suppliers
            — a single disruption there would affect {highShareCountry.count} of your{' '}
            {totalSuppliers} suppliers simultaneously.
          </p>
        </div>
      )}

      {/* Bar chart */}
      <ResponsiveContainer width="100%" height={chartH}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 0, right: rightMargin, bottom: 0, left: leftMargin }}
          barSize={barSize}
        >
          <XAxis
            type="number"
            domain={[0, totalSuppliers]}
            hide
          />
          <YAxis
            type="category"
            dataKey="country"
            width={120}
            tick={<CountryTick />}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            content={<ChartTooltip />}
            cursor={{ fill: '#F1F5F9' }}
          />
          <Bar
            dataKey="count"
            radius={[0, 4, 4, 0]}
            isAnimationActive
            animationDuration={600}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={riskColor(entry.composite)} />
            ))}
            <LabelList
              dataKey="label"
              position="right"
              content={<BarValueLabel />}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Risk colour legend */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
        <span className="text-xs text-slate-400">Bar colour = country risk</span>
        {[
          ['LOW',      RISK_COLORS.LOW,      '< 30'],
          ['MODERATE', RISK_COLORS.MODERATE, '30–54'],
          ['HIGH',     RISK_COLORS.HIGH,     '55–74'],
          ['CRITICAL', RISK_COLORS.CRITICAL, '75+'],
        ].map(([label, color, range]) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-500">{label} ({range})</span>
          </div>
        ))}
      </div>
    </div>
  )
}
