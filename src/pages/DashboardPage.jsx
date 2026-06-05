import { useEffect, useRef, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import { useSupplierData }  from '../hooks/useSupplierData'
import useRiskScore          from '../hooks/useRiskScore'

// Layout components
import StatusBanner      from '../components/dashboard/StatusBanner'
import RiskScoreGauge    from '../components/dashboard/RiskScoreGauge'
import TopRisks          from '../components/dashboard/TopRisks'
import EmptyDashboard    from '../components/dashboard/EmptyDashboard'
import RiskSummaryPrint  from '../components/dashboard/RiskSummaryPrint'
import RiskAdvisor       from '../components/dashboard/RiskAdvisor'
import WorldMap          from '../components/map/WorldMap'
import ConcentrationChart from '../components/charts/ConcentrationChart'
import EventFeed         from '../components/disruptions/EventFeed'
import allEvents         from '../data/events.json'

// ─── Action bar ───────────────────────────────────────────────────────────────

function ActionBar({ onUpload, onExportPDF, isPrinting }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Export PDF */}
      <button
        type="button"
        onClick={onExportPDF}
        disabled={isPrinting}
        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
      >
        {isPrinting ? (
          <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 16 16" fill="none" aria-hidden>
            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeDasharray="20" strokeDashoffset="10"/>
          </svg>
        ) : (
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
            <path fillRule="evenodd" d="M7.25 1.5a.75.75 0 011.5 0v6.19l1.97-1.97a.75.75 0 111.06 1.06L8.53 10.03a.75.75 0 01-1.06 0L4.22 6.78a.75.75 0 011.06-1.06l1.97 1.97V1.5zM2.5 13.25a.75.75 0 01.75-.75h9.5a.75.75 0 010 1.5h-9.5a.75.75 0 01-.75-.75z" clipRule="evenodd"/>
          </svg>
        )}
        {isPrinting ? 'Preparing…' : 'Export PDF'}
      </button>

      {/* Upload new data */}
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
        <div key={label} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
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

  const {
    overallScore,
    riskLevel,
    components,
    topRisks,
    enrichedBreakdown,
    hhi,
    matchedEvents,
  } = useRiskScore()

  // ── Brief calculation skeleton — shows for one frame after suppliers change ─
  const [isCalculating, setIsCalculating] = useState(false)
  const prevSuppliersRef = useRef(suppliers)
  useEffect(() => {
    if (prevSuppliersRef.current !== suppliers && suppliers.length > 0) {
      setIsCalculating(true)
      const id = setTimeout(() => setIsCalculating(false), 400)
      prevSuppliersRef.current = suppliers
      return () => clearTimeout(id)
    }
  }, [suppliers])

  // ── Print setup ────────────────────────────────────────────────────────────
  const printRef = useRef(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `SupplyLens Risk Summary — ${new Date().toISOString().slice(0, 10)}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 16mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      }
    `,
  })

  // ── Empty state ────────────────────────────────────────────────────────────

  if (source === 'none') {
    return (
      <>
        <div className="max-w-content mx-auto px-6 py-10">
          <EmptyDashboard
            onLoadSample={loadSampleData}
            onUpload={() => navigate('/upload')}
          />
        </div>
        {/* Advisor visible on empty state — shows "upload first" message */}
        <RiskAdvisor hasData={false} />
      </>
    )
  }

  // ── Loading ────────────────────────────────────────────────────────────────

  if (source !== 'none' && suppliers.length === 0) {
    return (
      <>
        <div className="max-w-content mx-auto px-6 py-10 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-sm">Loading supplier data…</p>
          </div>
        </div>
        <RiskAdvisor hasData={false} />
      </>
    )
  }

  // ── Full dashboard ─────────────────────────────────────────────────────────

  return (
    <>
      <main className="max-w-content mx-auto px-6 py-8 space-y-6">

        {/* ── Hidden print component — react-to-print copies this into iframe ── */}
        <div style={{ position: 'absolute', left: '-9999px', top: 0, width: 794 }} aria-hidden>
          <RiskSummaryPrint
            ref={printRef}
            overallScore={overallScore}
            riskLevel={riskLevel}
            components={components}
            topRisks={topRisks}
            stats={stats}
            enrichedBreakdown={enrichedBreakdown}
            fileName={fileName}
          />
        </div>

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
          <ActionBar
            onUpload={() => navigate('/upload')}
            onExportPDF={handlePrint}
            isPrinting={false}
          />
        </div>

        {/* ── Status banner ── */}
        <StatusBanner riskLevel={riskLevel} topRisks={topRisks} />

        {/* ── Stats strip ── */}
        <StatsStrip stats={stats} />

        {/* ── Row 1: Gauge + Top Risks — skeleton while risk scores compute ── */}
        {isCalculating ? (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start animate-pulse">
            {/* Gauge skeleton */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 h-64 flex items-center justify-center">
              <div className="w-40 h-40 rounded-full bg-slate-100 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-400 rounded-full animate-spin" />
              </div>
            </div>
            {/* Top Risks skeleton */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="h-4 bg-slate-100 rounded w-1/3" />
              {[1,2,3].map(i => (
                <div key={i} className="space-y-2 pb-4 border-b border-slate-100 last:border-0">
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                  <div className="h-3 bg-slate-100 rounded w-full" />
                  <div className="h-3 bg-slate-100 rounded w-4/5" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
            <RiskScoreGauge
              overallScore={overallScore}
              riskLevel={riskLevel}
              components={components}
            />
            <TopRisks risks={topRisks} />
          </div>
        )}

        {/* ── Row 2: World Map ── */}
        <WorldMap suppliers={suppliers} />

        {/* ── Row 3: Concentration Chart + Disruption Feed ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <ConcentrationChart
            breakdown={enrichedBreakdown}
            hhi={hhi}
            totalSuppliers={stats.totalSuppliers}
          />
          <EventFeed suppliers={suppliers} allEvents={allEvents} />
        </div>

      </main>

      {/* ── Risk Advisor — fixed floating chat, always on top ── */}
      <RiskAdvisor
        hasData
        overallScore={overallScore}
        riskLevel={riskLevel}
        components={components}
        topRisks={topRisks}
        enrichedBreakdown={enrichedBreakdown}
        stats={stats}
        matchedEvents={matchedEvents}
      />
    </>
  )
}
