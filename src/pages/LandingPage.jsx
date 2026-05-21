import { useNavigate, Link } from 'react-router-dom'
import { useSupplierData } from '../hooks/useSupplierData'

// ─── SVG Illustrations ────────────────────────────────────────────────────────

/** Abstract world-map silhouette — muted, decorative */
function WorldMapDecoration() {
  return (
    <svg
      viewBox="0 0 800 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      aria-hidden
    >
      {/* Grid lines */}
      {[0,1,2,3,4,5,6].map(i => (
        <line key={`h${i}`} x1="0" y1={i*70} x2="800" y2={i*70} stroke="#E2E8F0" strokeWidth="1"/>
      ))}
      {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
        <line key={`v${i}`} x1={i*80} y1="0" x2={i*80} y2="420" stroke="#E2E8F0" strokeWidth="1"/>
      ))}

      {/* Continent blobs — rough shapes, purely decorative */}
      {/* North America */}
      <path d="M80,80 Q110,60 160,75 Q200,85 210,120 Q220,155 190,175 Q165,195 140,185 Q110,175 90,155 Q70,130 80,80Z" fill="#DBEAFE" opacity="0.7"/>
      {/* Europe */}
      <path d="M360,75 Q390,65 420,80 Q445,90 440,115 Q435,140 410,150 Q385,158 362,145 Q340,132 345,105 Q350,85 360,75Z" fill="#DBEAFE" opacity="0.7"/>
      {/* Africa */}
      <path d="M370,170 Q400,160 425,175 Q450,195 448,240 Q446,285 420,310 Q395,330 368,318 Q342,305 338,265 Q334,225 342,195 Q350,168 370,170Z" fill="#DBEAFE" opacity="0.7"/>
      {/* Asia */}
      <path d="M460,70 Q520,55 580,65 Q630,75 650,110 Q665,140 645,175 Q620,205 570,215 Q520,222 478,205 Q440,188 440,150 Q440,115 460,70Z" fill="#DBEAFE" opacity="0.7"/>
      {/* South America */}
      <path d="M195,215 Q225,200 255,215 Q280,230 278,270 Q275,310 252,335 Q228,355 200,345 Q172,333 168,300 Q163,265 172,240 Q180,218 195,215Z" fill="#DBEAFE" opacity="0.7"/>
      {/* Australia */}
      <path d="M608,265 Q640,252 668,265 Q692,278 690,305 Q688,330 662,340 Q636,350 614,336 Q592,322 595,300 Q597,275 608,265Z" fill="#DBEAFE" opacity="0.7"/>

      {/* Supply chain connection lines */}
      <line x1="170" y1="130" x2="490" y2="135" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8"/>
      <line x1="490" y1="135" x2="640" y2="285" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8"/>
      <line x1="170" y1="130" x2="390" y2="108" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8"/>
      <line x1="390" y1="108" x2="490" y2="135" stroke="#93C5FD" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.8"/>
      <line x1="220" y1="270" x2="390" y2="240" stroke="#93C5FD" strokeWidth="1" strokeDasharray="4 4" opacity="0.5"/>

      {/* Supplier nodes — pulsing dots */}
      {[
        [170, 130, '#2563EB', 8],   // North America
        [390, 108, '#2563EB', 6],   // Europe
        [490, 135, '#EF4444', 10],  // Asia (large — high concentration)
        [560, 150, '#2563EB', 5],   // East Asia
        [640, 285, '#2563EB', 5],   // Australia
        [220, 270, '#2563EB', 5],   // South America
        [430, 240, '#F59E0B', 6],   // Middle East
      ].map(([x, y, color, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r + 6} fill={color} opacity="0.12"/>
          <circle cx={x} cy={y} r={r} fill={color} opacity="0.9"/>
          <circle cx={x} cy={y} r={r - 2} fill="white" opacity="0.4"/>
        </g>
      ))}

      {/* Risk badge floating near Asia node */}
      <rect x="505" y="110" width="68" height="22" rx="4" fill="#EF4444" opacity="0.9"/>
      <text x="539" y="124" textAnchor="middle" fill="white" fontSize="10" fontWeight="700" fontFamily="Inter,sans-serif">HIGH RISK</text>
    </svg>
  )
}

/** Upload icon */
function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  )
}

/** Gauge / analysis icon */
function AnalyzeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  )
}

/** Lightbulb / act icon */
function ActIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6" aria-hidden>
      <line x1="12" y1="2" x2="12" y2="6"/>
      <line x1="12" y1="18" x2="12" y2="22"/>
      <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
      <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
      <line x1="2" y1="12" x2="6" y2="12"/>
      <line x1="18" y1="12" x2="22" y2="12"/>
      <circle cx="12" cy="12" r="4"/>
    </svg>
  )
}

// ─── Section: Hero ────────────────────────────────────────────────────────────

function Hero({ onTrySample, onUpload }) {
  return (
    <section className="relative overflow-hidden bg-white border-b border-slate-100">
      {/* Subtle grid background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, #CBD5E1 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
        aria-hidden
      />

      {/* Gradient fade over grid */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-white/80 to-blue-50/60" aria-hidden />

      <div className="relative max-w-content mx-auto px-6 py-20 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left: copy */}
          <div className="space-y-8">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" aria-hidden />
              <span className="text-xs font-semibold text-blue-700 tracking-wide">
                Supply Chain Intelligence — Free, No Signup
              </span>
            </div>

            {/* Headline */}
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-[1.1]">
                See your supply chain
                <br />
                risk in{' '}
                <span className="text-blue-600 relative">
                  60 seconds.
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" aria-hidden>
                    <path d="M0 6 Q50 0 100 4 Q150 8 200 2" stroke="#BFDBFE" strokeWidth="3" strokeLinecap="round"/>
                  </svg>
                </span>
              </h1>

              <p className="mt-5 text-lg text-slate-500 leading-relaxed max-w-lg">
                Upload your supplier list or explore sample data. Instantly see geographic
                concentration, country risks, and your biggest vulnerabilities —
                with actionable recommendations.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={onTrySample}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm shadow-blue-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                Try with Sample Data
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
                  <path fillRule="evenodd" d="M2 8a.75.75 0 01.75-.75h8.69L8.22 4.03a.75.75 0 011.06-1.06l4.5 4.25a.75.75 0 010 1.06l-4.5 4.25a.75.75 0 01-1.06-1.06l3.22-3.22H2.75A.75.75 0 012 8z" clipRule="evenodd"/>
                </svg>
              </button>

              <button
                type="button"
                onClick={onUpload}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              >
                <UploadIcon />
                Upload Your Supplier List
              </button>
            </div>

            {/* Trust line */}
            <p className="text-sm text-slate-400 flex items-center gap-2">
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden>
                <path fillRule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm11.78-1.72a.75.75 0 00-1.06-1.06L7 8.94 5.28 7.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" clipRule="evenodd"/>
              </svg>
              No signup required · Your data stays in your browser · Zero cost
            </p>
          </div>

          {/* Right: map illustration */}
          <div className="relative hidden lg:block">
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl overflow-hidden">
              {/* Fake browser chrome */}
              <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-md border border-slate-200 px-3 py-1">
                  <span className="text-xs text-slate-400">supplylens.app/dashboard</span>
                </div>
              </div>
              {/* Map visual */}
              <div className="aspect-[16/9] p-4 bg-gradient-to-br from-slate-50 to-blue-50/30">
                <WorldMapDecoration />
              </div>
              {/* Floating risk badge */}
              <div className="absolute top-16 right-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2.5 text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Risk Score</p>
                <p className="text-2xl font-bold text-orange-500">64</p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-700 uppercase tracking-wide">HIGH</span>
              </div>
              {/* Floating stat */}
              <div className="absolute bottom-12 left-4 bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2.5 text-left">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Top Exposure</p>
                <p className="text-sm font-bold text-slate-900">China · 36%</p>
                <p className="text-[10px] text-slate-400">18 of 50 suppliers</p>
              </div>
            </div>

            {/* Decorative blur orbs */}
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-blue-100 blur-3xl opacity-50" aria-hidden />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-indigo-100 blur-2xl opacity-40" aria-hidden />
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: How It Works ────────────────────────────────────────────────────

const HOW_STEPS = [
  {
    num: '01',
    icon: <UploadIcon />,
    title: 'Upload',
    body: 'Drop your supplier spreadsheet — CSV or Excel. We only need supplier names and countries. Everything else is optional.',
    color: 'bg-blue-50 text-blue-600',
  },
  {
    num: '02',
    icon: <AnalyzeIcon />,
    title: 'Analyze',
    body: 'Our engine calculates geographic concentration, country risk scores, and matches your suppliers against 35+ recent disruption events.',
    color: 'bg-violet-50 text-violet-600',
  },
  {
    num: '03',
    icon: <ActIcon />,
    title: 'Act',
    body: 'Get a composite risk score, your top vulnerabilities ranked by severity, and plain-language recommendations — instantly.',
    color: 'bg-emerald-50 text-emerald-600',
  },
]

function HowItWorks() {
  return (
    <section className="py-20 bg-white" id="how-it-works">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">How it works</h2>
          <p className="mt-3 text-slate-500 max-w-md mx-auto">
            From spreadsheet to risk analysis in under a minute. No configuration, no data prep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector lines — desktop only */}
          <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px bg-gradient-to-r from-blue-200 via-violet-200 to-emerald-200" aria-hidden />

          {HOW_STEPS.map((step, i) => (
            <div key={i} className="relative flex flex-col items-center text-center">
              {/* Step number */}
              <div className="relative mb-5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${step.color} shadow-sm`}>
                  {step.icon}
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-[260px]">{step.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: Feature Cards ───────────────────────────────────────────────────

const FEATURES = [
  {
    emoji: '🗺️',
    title: 'Geographic Risk Map',
    body: 'See exactly where your suppliers cluster. Interactive world map shaded by supplier density — spot concentration risks at a glance.',
    tag: 'Visualization',
    tagColor: 'bg-blue-50 text-blue-600',
  },
  {
    emoji: '🎯',
    title: 'Composite Risk Score',
    body: 'One 0–100 number that captures geographic concentration, country risk, active disruptions, and single-source exposure — weighted and combined.',
    tag: 'Analytics',
    tagColor: 'bg-violet-50 text-violet-600',
  },
  {
    emoji: '⚡',
    title: 'Disruption Tracker',
    body: '35+ curated events — trade policy shifts, natural disasters, labor actions, and geopolitical events — matched against your specific supplier countries.',
    tag: 'Intelligence',
    tagColor: 'bg-orange-50 text-orange-700',
  },
  {
    emoji: '💡',
    title: 'Actionable Recommendations',
    body: 'Not just a risk score — prioritised findings with plain-English descriptions and specific next steps for your procurement team.',
    tag: 'Insights',
    tagColor: 'bg-emerald-50 text-emerald-700',
  },
]

function FeatureCards() {
  return (
    <section className="py-20 bg-slate-50 border-y border-slate-100" id="features">
      <div className="max-w-content mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">What you'll see</h2>
          <p className="mt-3 text-slate-500 max-w-md mx-auto">
            A full risk picture — built from your data, delivered in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
            >
              <div className="text-3xl mb-4">{f.emoji}</div>
              <span className={`self-start text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md mb-3 ${f.tagColor}`}>
                {f.tag}
              </span>
              <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed flex-1">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Section: The Problem ─────────────────────────────────────────────────────

const STATS = [
  { value: '$100K+', label: 'Cost of enterprise SCM tools' },
  { value: '6 mo',   label: 'Typical implementation time' },
  { value: '0',      label: 'Cost to use SupplyLens' },
]

function TheProblem() {
  return (
    <section className="py-20 bg-white" id="about">
      <div className="max-w-content mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 mb-6">
                <span className="text-xs font-semibold text-slate-600 tracking-wide">The Gap We Fill</span>
              </div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-5">
                Enterprise tools. Mid-market reality.
              </h2>
              <p className="text-slate-500 leading-relaxed mb-4">
                Enterprise supply chain risk platforms cost{' '}
                <strong className="text-slate-900">$100K+ per year</strong> and take months to implement. Mid-market
                manufacturers and procurement teams manage risk with spreadsheets and Google Alerts.
              </p>
              <p className="text-slate-500 leading-relaxed">
                SupplyLens bridges the gap — real risk intelligence, zero cost, zero setup. Built on
                public data from the World Bank, EM-DAT, OFAC, and curated industry events, it gives
                you the same visibility the big players have, in 60 seconds flat.
              </p>
            </div>

            {/* Stats */}
            <div className="flex flex-row lg:flex-col gap-4 lg:gap-3">
              {STATS.map(({ value, label }) => (
                <div
                  key={label}
                  className="flex-1 lg:flex-none bg-slate-50 rounded-2xl border border-slate-100 p-5 text-center lg:text-left min-w-[100px]"
                >
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Section: Final CTA ───────────────────────────────────────────────────────

function FinalCTA({ onTrySample, onUpload }) {
  return (
    <section className="py-20 bg-gradient-to-br from-blue-600 to-blue-700">
      <div className="max-w-content mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-white tracking-tight mb-3">
          Ready to see your risk exposure?
        </h2>
        <p className="text-blue-200 mb-8 max-w-md mx-auto">
          It takes 60 seconds. No account. No card. No catch.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={onTrySample}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-blue-700 text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            Try with Sample Data →
          </button>
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-500/40 text-white text-sm font-semibold border border-blue-400 hover:bg-blue-500/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            <UploadIcon />
            Upload Supplier List
          </button>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-content mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                <span className="text-white text-xs font-bold">SL</span>
              </div>
              <span className="text-white font-bold">SupplyLens</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-400">
              Supply chain risk intelligence for teams that can't afford to wait for
              a six-month enterprise implementation.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Links</p>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/dashboard" className="hover:text-white transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/methodology" className="hover:text-white transition-colors">
                  Methodology
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/vyj_yang/supplylens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors inline-flex items-center gap-1.5"
                >
                  GitHub
                  <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3 opacity-60" aria-hidden>
                    <path d="M3.5 1a.5.5 0 000 1h5.293L1.146 9.646a.5.5 0 00.708.708L9.5 2.707V8a.5.5 0 001 0V1.5a.5.5 0 00-.5-.5H3.5z"/>
                  </svg>
                </a>
              </li>
            </ul>
          </div>

          {/* Data sources */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Data Sources</p>
            <ul className="space-y-1 text-sm">
              {['World Bank Governance Indicators', 'EM-DAT Natural Disaster Database', 'OFAC Sanctions Lists', 'Curated industry disruption events'].map(src => (
                <li key={src} className="flex items-start gap-1.5">
                  <span className="text-slate-600 mt-1 shrink-0">·</span>
                  {src}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>
            Built by{' '}
            <a
              href="https://yujieyang.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-white transition-colors underline underline-offset-2"
            >
              Yujie Yang
            </a>
          </p>
          <p>Client-side only · No data leaves your browser · Open source</p>
        </div>
      </div>
    </footer>
  )
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate        = useNavigate()
  const { loadSampleData } = useSupplierData()

  const handleTrySample = () => {
    loadSampleData()
    navigate('/dashboard')
  }

  const handleUpload = () => navigate('/upload')

  return (
    <>
      <Hero onTrySample={handleTrySample} onUpload={handleUpload} />
      <HowItWorks />
      <FeatureCards />
      <TheProblem />
      <FinalCTA onTrySample={handleTrySample} onUpload={handleUpload} />
      <Footer />
    </>
  )
}
