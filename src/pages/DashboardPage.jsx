import { useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useSupplierData }  from '../hooks/useSupplierData'
import useRiskScore          from '../hooks/useRiskScore'

// Layout components
import StatusBanner   from '../components/dashboard/StatusBanner'
import RiskScoreGauge from '../components/dashboard/RiskScoreGauge'
import TopRisks       from '../components/dashboard/TopRisks'
import EmptyDashboard from '../components/dashboard/EmptyDashboard'
import WorldMap       from '../components/map/WorldMap'
import ConcentrationChart from '../components/charts/ConcentrationChart'
import EventFeed      from '../components/disruptions/EventFeed'

// ─── Action buttons ───────────────────────────────────────────────────────────

function ActionBar({ onUpload }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        type="button"
        onClick={onUpload}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
          <path d="M8.75 4.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
        </svg>
        Upload New Data
      </button>

      <Link
        to="/methodology"
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
          <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm9 3a1 1 0 11-2 0 1 1 0 012 0zm-.25-6.25a.75.75 0 00-1.5 0v3.5a.75.75 0 001.5 0v-3.5z" clipRule="evenodd" />
        </svg>
        Methodology
      </Link>
    </div>
  )
}

// ─── Stats strip ──────────────────────────────────────────────────────────────

function StatsStrip({ stats }) {
  const items = [
    { label: 'Suppliers',   value: stats.totalSuppliers },
    { label: 'Countries',   value: stats.countries },
    { label: 'Commodities', value: stats.commodities },
    {
      label: 'Total Spend',
      value: stats.totalSpend > 0
        ? `$${(stats.totalSpend / 1_000_000).toFixed(1)}M`
        : '—',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {items.map(({ label, value }) => (
        <div
          key={label}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
        </div>
      ))}
    </div>
  )
}

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate()
  const { suppliers, source, fileName, stats, loadSampleData } = useSupplierData()

  // Auto-load sample data only when source is still uninitialised
  // (i.e. user came from landing "Try sample" — loadSampleData was already
  // called there, so source will be 'sample' and this won't fire again)
  useEffect(() => {
    if (source === 'none') {
      // Don't auto-load here — show the empty CTA instead so users
      // who land directly on /dashboard can choose what they want.
    }
  }, [source])

  const {
    overallScore,
    riskLevel,
    components,
    topRisks,
    enrichedBreakdown,
    hhi,
    matchedEvents,
  } = useRiskScore()

  // ── Empty state (no data loaded) ──────────────────────────────────────────

  if (source === 'none') {
    return (
      <div className="max-w-content mx-auto px-6 py-10">
        <EmptyDashboard
          onLoadSample={() => { loadSampleData() }}
          onUpload={() => navigate('/upload')}
        />
      </div>
    )
  }

  // ── Loading (data is being computed — suppliers array briefly empty) ───────

  if (source !== 'none' && suppliers.length === 0) {
    return (
      <div className="max-w-content mx-auto px-6 py-10 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm">Loading supplier data…</p>
        </div>
      </div>
    )
  }

  // ── Full dashboard ─────────────────────────────────────────────────────────

  return (
    <main className="max-w-content mx-auto px-6 py-8 space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Supply Chain Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            {source === 'sample'
              ? 'Showing sample data · 50 suppliers across 12 countries'
              : `Uploaded: ${fileName}`}
          </p>
        </div>
        <ActionBar onUpload={() => navigate('/upload')} />
      </div>

      {/* ── Status banner (full width) ── */}
      <StatusBanner riskLevel={riskLevel} topRisks={topRisks} />

      {/* ── Stats strip (full width) ── */}
      <StatsStrip stats={stats} />

      {/* ── Row 1: Gauge + Top Risks ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <RiskScoreGauge
          overallScore={overallScore}
          riskLevel={riskLevel}
          components={components}
        />
        <TopRisks risks={topRisks} />
      </div>

      {/* ── Row 2: World Map (full width) ── */}
      <WorldMap suppliers={suppliers} />

      {/* ── Row 3: Concentration Chart + Disruption Feed ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <ConcentrationChart
          breakdown={enrichedBreakdown}
          hhi={hhi}
          totalSuppliers={stats.totalSuppliers}
        />
        <EventFeed events={matchedEvents} />
      </div>

    </main>
  )
}
