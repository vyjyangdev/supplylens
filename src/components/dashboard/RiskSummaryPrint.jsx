/**
 * RiskSummaryPrint — print-only, single-A4-page risk summary.
 *
 * Sizing budget (A4 @ 96 dpi, 16 mm margins → ~1009 px usable):
 *   Header           ~72 px
 *   Score + stats    ~110 px
 *   Sub-scores       ~62 px
 *   Weight legend    ~22 px
 *   Top 3 risks      ~234 px   (≤3 × ~78 px each)
 *   Geo breakdown    ~90 px
 *   Footer           ~22 px
 *   ─────────────────────────
 *   TOTAL            ~612 px   (leaves ~397 px slack for variation)
 *
 * Inline styles are used throughout — Tailwind is not guaranteed inside
 * the react-to-print iframe.
 */
import { forwardRef } from 'react'

// ─── Tokens ──────────────────────────────────────────────────────────────────

const COLOR = {
  LOW:      { bg: '#F0FDF4', text: '#166534', border: '#86EFAC' },
  MODERATE: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
  HIGH:     { bg: '#FFF7ED', text: '#9A3412', border: '#FDBA74' },
  CRITICAL: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
}
const SCORE_COLOR = { LOW: '#16A34A', MODERATE: '#D97706', HIGH: '#EA580C', CRITICAL: '#DC2626' }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function levelOf(score) {
  if (score >= 75) return 'CRITICAL'
  if (score >= 55) return 'HIGH'
  if (score >= 30) return 'MODERATE'
  return 'LOW'
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function fmtSpend(n) {
  if (!n || n === 0) return '—'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Compact sub-score tile — tighter padding, smaller number */
function ScorePill({ label, score }) {
  const level = levelOf(score)
  const c = COLOR[level]
  return (
    <div style={{
      flex: 1,
      border: `1px solid ${c.border}`,
      borderRadius: 6,
      padding: '5px 8px',
      backgroundColor: c.bg,
      textAlign: 'center',
    }}>
      <div style={{ fontSize: 9, color: '#6B7280', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: SCORE_COLOR[level], lineHeight: 1 }}>{score}</div>
      <div style={{ fontSize: 8, fontWeight: 700, color: c.text, marginTop: 2,
        textTransform: 'uppercase', letterSpacing: '0.05em' }}>{level}</div>
    </div>
  )
}

/**
 * Compact risk row — description and recommendation each clamped to 1 line.
 * Reduced vertical rhythm vs original.
 */
function RiskRow({ risk, index }) {
  const c = COLOR[risk.severity] ?? COLOR.MODERATE
  return (
    <div style={{
      marginBottom: 7,
      paddingBottom: 7,
      borderBottom: '1px solid #F1F5F9',
    }}>
      {/* Meta row: number · badge · type */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', minWidth: 14 }}>
          #{index + 1}
        </span>
        <span style={{
          fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          padding: '1px 5px', borderRadius: 3,
          backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`,
          whiteSpace: 'nowrap',
        }}>
          {risk.severity}
        </span>
        <span style={{ fontSize: 9, color: '#94A3B8', textTransform: 'capitalize' }}>
          {risk.type?.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Title — 11 px bold */}
      <div style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', marginLeft: 20, marginBottom: 2,
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {risk.title}
      </div>

      {/* Description — 1 line */}
      <div style={{ fontSize: 10, color: '#475569', lineHeight: 1.4, marginLeft: 20, marginBottom: 2,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
        {risk.description}
      </div>

      {/* Recommendation — 1 line */}
      <div style={{ fontSize: 10, color: '#1D4ED8', lineHeight: 1.4, marginLeft: 20,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
        <strong style={{ color: '#1E3A8A' }}>Action: </strong>{risk.recommendation}
      </div>
    </div>
  )
}

/**
 * Single stat — compact label + value pair in one horizontal strip.
 * No flex: 1 — rendered inside a flex row with gap.
 */
function Stat({ label, value }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8',
        textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A', whiteSpace: 'nowrap' }}>
        {value}
      </span>
    </div>
  )
}

// ─── GeoBarChart ─────────────────────────────────────────────────────────────

const BAR_H      = 16   // height of each bar
const BAR_GAP    = 8    // vertical gap between rows
const LABEL_W    = 90   // px reserved for country name
const VALUE_W    = 48   // px reserved for "18 (36%)" label on right
const RISK_W     = 44   // px reserved for risk badge on far right
const CHART_PAD  = 8    // left/right padding inside SVG

const SCORE_FILL = {
  LOW:      '#86EFAC',
  MODERATE: '#FCD34D',
  HIGH:     '#FDBA74',
  CRITICAL: '#FCA5A5',
}
const SCORE_STROKE = {
  LOW:      '#22C55E',
  MODERATE: '#F59E0B',
  HIGH:     '#F97316',
  CRITICAL: '#EF4444',
}

function GeoBarChart({ rows }) {
  if (!rows.length) return null

  const maxPct    = Math.max(...rows.map(r => parseFloat(r.percentage) || 0), 1)
  const rowHeight = BAR_H + BAR_GAP
  const svgH      = rows.length * rowHeight - BAR_GAP + 4   // 4 px bottom padding
  // bar track starts after the label, ends before value + risk labels
  const trackX    = LABEL_W + CHART_PAD
  const trackW    = 762 - LABEL_W - VALUE_W - RISK_W - CHART_PAD * 2

  return (
    <svg
      width="100%"
      viewBox={`0 0 762 ${svgH}`}
      style={{ display: 'block', overflow: 'visible', maxHeight: 180 }}
    >
      {/* Row background alternating */}
      {rows.map((row, i) => (
        <rect
          key={`bg-${i}`}
          x={0} y={i * rowHeight}
          width={762} height={BAR_H}
          fill={i % 2 === 0 ? '#F8FAFC' : 'transparent'}
          rx={2}
        />
      ))}

      {/* Bars */}
      {rows.map((row, i) => {
        const pct   = parseFloat(row.percentage) || 0
        const barW  = Math.max((pct / maxPct) * trackW, 3)
        const y     = i * rowHeight
        const lvl   = levelOf(row.composite ?? 0)
        const fill  = SCORE_FILL[lvl]
        const stroke= SCORE_STROKE[lvl]

        return (
          <g key={i}>
            {/* Country label */}
            <text
              x={LABEL_W - 4} y={y + BAR_H / 2 + 1}
              textAnchor="end" dominantBaseline="middle"
              fontSize={10} fontWeight={600} fill="#0F172A"
              fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            >
              {row.country}
            </text>

            {/* Track (background) */}
            <rect
              x={trackX} y={y + 1}
              width={trackW} height={BAR_H - 2}
              fill="#F1F5F9" rx={3}
            />

            {/* Filled bar */}
            <rect
              x={trackX} y={y + 1}
              width={barW} height={BAR_H - 2}
              fill={fill} stroke={stroke} strokeWidth={0.5} rx={3}
            />

            {/* 30% warning line */}
            {trackW * (30 / maxPct) < trackW && (
              <line
                x1={trackX + trackW * (30 / maxPct)}
                y1={y}
                x2={trackX + trackW * (30 / maxPct)}
                y2={y + BAR_H}
                stroke="#EF4444" strokeWidth={0.8} strokeDasharray="2 2"
              />
            )}

            {/* Percentage + count label */}
            <text
              x={trackX + trackW + 6} y={y + BAR_H / 2 + 1}
              dominantBaseline="middle"
              fontSize={9} fontWeight={600} fill="#475569"
              fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            >
              {row.count} ({pct}%)
            </text>

            {/* Risk level badge (text) */}
            <text
              x={762 - 2} y={y + BAR_H / 2 + 1}
              textAnchor="end" dominantBaseline="middle"
              fontSize={8} fontWeight={700} fill={stroke}
              fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            >
              {lvl}
            </text>
          </g>
        )
      })}

      {/* 30% threshold label at top of chart */}
      {(() => {
        const lineX = trackX + trackW * (30 / maxPct)
        if (lineX > trackX && lineX < trackX + trackW) {
          return (
            <text
              x={lineX} y={-3}
              textAnchor="middle"
              fontSize={7} fill="#EF4444"
              fontFamily="Inter, Helvetica Neue, Arial, sans-serif"
            >
              30% threshold
            </text>
          )
        }
        return null
      })()}
    </svg>
  )
}

// ─── RiskSummaryPrint ─────────────────────────────────────────────────────────

const RiskSummaryPrint = forwardRef(function RiskSummaryPrint(
  {
    overallScore = 0,
    riskLevel    = 'LOW',
    components   = {},
    topRisks     = [],
    stats        = {},
    enrichedBreakdown = [],
    fileName     = 'sample',
  },
  ref,
) {
  const today      = new Date()
  const scoreColor = SCORE_COLOR[riskLevel] ?? SCORE_COLOR.LOW
  const riskColors = COLOR[riskLevel]       ?? COLOR.LOW

  const topCountry     = enrichedBreakdown[0]
  const singleSrcCount = (components?.singleSource?.detail?.singleSourceCategories ?? [])
    .filter(c => c.supplierCount === 1).length
  const matchedEvents  = components?.disruption?.detail?.matchedEvents?.length ?? 0

  const subScores = [
    { label: 'Geographic',    score: Math.round(components?.geographic?.score   ?? 0) },
    { label: 'Country Risk',  score: Math.round(components?.country?.score      ?? 0) },
    { label: 'Disruptions',   score: Math.round(components?.disruption?.score   ?? 0) },
    { label: 'Single-Source', score: Math.round(components?.singleSource?.score ?? 0) },
  ]

  // Limit to 3 risks — key space saving vs original 5
  const printRisks = topRisks.slice(0, 3)

  const sourceLabel = (fileName === 'sample-suppliers.json' || fileName === 'sample')
    ? 'Sample dataset · 50 suppliers'
    : `Source: ${fileName}`

  return (
    <div ref={ref}>
      {/*
        Embedded <style> is copied into the react-to-print iframe.
        @page sets A4 size + margins.
        overflow:hidden on html/body prevents a second page from rendering.
      */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 16mm 16mm 14mm 16mm;
        }
        html, body {
          margin: 0;
          padding: 0;
          background: white;
          overflow: hidden;
          max-height: 100%;
        }
        * {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          box-sizing: border-box;
          font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
        }
        @media print {
          html, body { overflow: hidden; max-height: 100vh; }
        }
      `}</style>

      {/* Page — capped at the A4 usable height so content never spills */}
      <div style={{
        width: '100%',
        maxWidth: 762,       /* A4 width 210mm - 2×16mm margins ≈ 178mm → 762px at 96dpi */
        margin: '0 auto',
        backgroundColor: '#fff',
        color: '#0F172A',
        fontSize: 11,        /* body baseline — down from 12 */
        lineHeight: 1.4,
        overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          marginBottom: 10,
          paddingBottom: 8,
          borderBottom: '2px solid #2563EB',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
              <div style={{
                width: 24, height: 24, borderRadius: 5,
                backgroundColor: '#2563EB',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ color: '#fff', fontSize: 9, fontWeight: 700 }}>SL</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>SupplyLens</span>
            </div>
            {/* Heading 14px per spec */}
            <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
              Supply Chain Risk Summary
            </div>
            <div style={{ fontSize: 9, color: '#64748B', marginTop: 1 }}>{sourceLabel}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#94A3B8' }}>Generated</div>
            <div style={{ fontSize: 10, fontWeight: 600, color: '#475569' }}>{formatDate(today)}</div>
          </div>
        </div>

        {/* ── Score block + single-row stats ── */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 10, alignItems: 'stretch' }}>

          {/* Score box — smaller padding and number */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${riskColors.border}`,
            borderRadius: 10,
            padding: '10px 18px',
            backgroundColor: riskColors.bg,
            minWidth: 110,
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: '#64748B',
              textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 3 }}>
              Overall Risk
            </div>
            {/* Large score number — 42px (down from 52) */}
            <div style={{ fontSize: 42, fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
              {overallScore}
            </div>
            <div style={{ fontSize: 8, color: '#94A3B8', marginBottom: 6 }}> / 100</div>
            <div style={{
              fontSize: 10, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.07em',
              padding: '3px 10px', borderRadius: 20,
              backgroundColor: riskColors.border, color: riskColors.text,
            }}>
              {riskLevel}
            </div>
          </div>

          {/* Stats — single horizontal line (was 2 rows) */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <Stat label="Suppliers"   value={stats.totalSuppliers ?? '—'} />
              <Stat label="Countries"   value={stats.countries      ?? '—'} />
              <Stat label="Commodities" value={stats.commodities    ?? '—'} />
              <Stat label="Spend"       value={fmtSpend(stats.totalSpend)} />
            </div>
            {/* Row 2 — contextual risk stats */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap',
              paddingTop: 8, borderTop: '1px solid #F1F5F9' }}>
              <Stat
                label="Top Exposure"
                value={topCountry
                  ? `${topCountry.country} (${topCountry.percentage}%)`
                  : '—'}
              />
              <Stat
                label="Single-Source"
                value={singleSrcCount > 0 ? `${singleSrcCount} categor${singleSrcCount !== 1 ? 'ies' : 'y'}` : 'None'}
              />
              <Stat label="Disruptions Matched" value={matchedEvents} />
            </div>
          </div>
        </div>

        {/* ── Sub-score pills ── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          {subScores.map(s => <ScorePill key={s.label} {...s} />)}
        </div>

        {/* Weight legend */}
        <div style={{ fontSize: 8, color: '#CBD5E1', marginBottom: 12, textAlign: 'center' }}>
          Weights: Geographic 35% · Country Risk 30% · Disruptions 20% · Single-Source 15%
        </div>

        {/* ── Top 3 risks ── */}
        <div style={{ marginBottom: 12 }}>
          <div style={{
            fontSize: 9, fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B',
            marginBottom: 8,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span>Top Risk Findings</span>
            <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <span>{printRisks.length} of {topRisks.length} shown</span>
          </div>

          {printRisks.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: 10, padding: '10px 0' }}>
              ✅ No significant risks detected
            </div>
          ) : (
            printRisks.map((risk, i) => <RiskRow key={i} risk={risk} index={i} />)
          )}
        </div>

        {/* ── Geographic breakdown — SVG bar chart + chips ── */}
        {enrichedBreakdown.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: 9, fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748B',
              marginBottom: 6,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span>Geographic Concentration (Top {Math.min(enrichedBreakdown.length, 6)})</span>
              <div style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </div>

            {/* ── Horizontal bar chart ── */}
            <GeoBarChart rows={enrichedBreakdown.slice(0, 6)} />
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid #E2E8F0',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: 8, color: '#CBD5E1' }}>
            Generated by SupplyLens · supplylens.app
          </span>
          <span style={{ fontSize: 8, color: '#CBD5E1' }}>
            Based on public data (World Bank, EM-DAT, OFAC) · For procurement planning use only
          </span>
        </div>

      </div>
    </div>
  )
})

export default RiskSummaryPrint
