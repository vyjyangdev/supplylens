import { Link } from 'react-router-dom'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

// ─── Shared primitives ────────────────────────────────────────────────────────

function Section({ id, children }) {
  return (
    <section id={id} className="scroll-mt-24">
      {children}
    </section>
  )
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm p-6 md:p-8 ${className}`}>
      {children}
    </div>
  )
}

function SectionHeading({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-2">{eyebrow}</p>
      )}
      <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
      {subtitle && <p className="text-slate-500 text-sm leading-relaxed">{subtitle}</p>}
    </div>
  )
}

function FormulaBlock({ children }) {
  return (
    <div className="my-5 px-5 py-4 rounded-lg bg-slate-50 border border-slate-200 font-mono text-sm text-slate-700 leading-relaxed overflow-x-auto">
      {children}
    </div>
  )
}

function Callout({ type = 'info', children }) {
  const styles = {
    info:    'bg-blue-50  border-blue-200  text-blue-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    note:    'bg-slate-50 border-slate-200 text-slate-700',
  }
  const icons = {
    info:    'ℹ️',
    warning: '⚠️',
    note:    '📝',
  }
  return (
    <div className={`flex gap-3 px-4 py-3 rounded-lg border text-sm leading-relaxed my-5 ${styles[type]}`}>
      <span className="shrink-0 mt-0.5">{icons[type]}</span>
      <div>{children}</div>
    </div>
  )
}

function RiskBand({ label, range, color, description }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-2 w-36 shrink-0">
        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-sm font-bold" style={{ color }}>{label}</span>
      </div>
      <span className="text-xs font-mono text-slate-500 w-16 shrink-0 mt-0.5">{range}</span>
      <span className="text-sm text-slate-600 leading-snug">{description}</span>
    </div>
  )
}

function DefList({ items }) {
  return (
    <dl className="divide-y divide-slate-100">
      {items.map(({ term, def }) => (
        <div key={term} className="py-3 sm:grid sm:grid-cols-[200px_1fr] sm:gap-6">
          <dt className="text-sm font-semibold text-slate-700 mb-1 sm:mb-0">{term}</dt>
          <dd className="text-sm text-slate-500 leading-relaxed">{def}</dd>
        </div>
      ))}
    </dl>
  )
}

// ─── Section 1: Score overview + pie chart ────────────────────────────────────

const WEIGHT_DATA = [
  { name: 'Geographic',   value: 35, color: '#2563EB' },
  { name: 'Country Risk', value: 30, color: '#7C3AED' },
  { name: 'Disruptions',  value: 20, color: '#EA580C' },
  { name: 'Single-Source',value: 15, color: '#DC2626' },
]

function CustomPieLabel({ cx, cy, midAngle, innerRadius, outerRadius, value }) {
  const RADIAN = Math.PI / 180
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5
  const x  = cx + r * Math.cos(-midAngle * RADIAN)
  const y  = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
      fontSize={13} fontWeight={700} fontFamily="Inter, sans-serif">
      {value}%
    </text>
  )
}

function ScoreOverview() {
  return (
    <Card>
      <SectionHeading
        eyebrow="The Formula"
        title="How Your Risk Score Is Calculated"
        subtitle="SupplyLens combines four independent risk signals into a single 0–100 composite score. Higher scores mean greater risk exposure."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Pie chart */}
        <div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={WEIGHT_DATA}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                labelLine={false}
                label={<CustomPieLabel />}
              >
                {WEIGHT_DATA.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [`${v}%`, 'Weight']}
                contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #E2E8F0' }}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value) => <span style={{ fontSize: 12, color: '#475569' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Component list */}
        <div className="space-y-3">
          {[
            { color: '#2563EB', weight: '35%', label: 'Geographic Concentration', desc: 'How many of your suppliers are concentrated in a single country or region.' },
            { color: '#7C3AED', weight: '30%', label: 'Country Risk',             desc: 'The inherent political, natural hazard, and trade risk of each supplier\'s country.' },
            { color: '#EA580C', weight: '20%', label: 'Disruption Exposure',      desc: 'Active events (disasters, trade restrictions, labor actions) matched to your supplier countries.' },
            { color: '#DC2626', weight: '15%', label: 'Single-Source Risk',       desc: 'Categories where you have only one or two qualified suppliers.' },
          ].map(c => (
            <div key={c.label} className="flex items-start gap-3">
              <div className="mt-1 w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-slate-900">{c.label}</span>
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: c.color + '20', color: c.color }}>{c.weight}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{c.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <FormulaBlock>
        Overall Score = 0.35 × Geographic + 0.30 × Country Risk + 0.20 × Disruptions + 0.15 × Single-Source
      </FormulaBlock>

      <div className="border-t border-slate-100 pt-5 mt-2">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Score bands</p>
        <RiskBand label="LOW"      range="0 – 29"  color="#22C55E" description="Healthy diversification. Continue routine monitoring." />
        <RiskBand label="MODERATE" range="30 – 54" color="#F59E0B" description="Meaningful exposure. Review findings and develop contingency plans." />
        <RiskBand label="HIGH"     range="55 – 74" color="#F97316" description="Significant risk. Initiate dual-sourcing programs and request supplier BCPs." />
        <RiskBand label="CRITICAL" range="75 – 100" color="#EF4444" description="Severe exposure. Escalate to leadership and activate contingency plans immediately." />
      </div>
    </Card>
  )
}

// ─── Section 2: Geographic ────────────────────────────────────────────────────

function GeographicSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Component 1 · 35% weight"
        title="Geographic Concentration"
        subtitle="Measures how unevenly your suppliers are distributed across countries — similar to how financial regulators assess market concentration."
      />

      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        We use the{' '}
        <strong className="text-slate-800">Herfindahl-Hirschman Index (HHI)</strong>
        {' '}— the same metric the US Department of Justice uses to assess market concentration in antitrust reviews. HHI squares each country's market share and sums the results, so a single dominant country pushes the score up disproportionately.
      </p>

      <FormulaBlock>
        {`HHI = Σ (share_i²)  for each country i\n\nGeographic Score = √HHI × 100`}
      </FormulaBlock>

      <DefList items={[
        { term: 'Why square the shares?', def: 'Squaring penalises large concentrations heavily. A supply base split 60/40 between two countries scores much higher than one split evenly across ten.' },
        { term: 'Why take the square root?', def: 'Raw HHI has a convex curve that\'s hard to interpret. The square-root normalization maps it to an intuitive 0–100 scale where 0 is perfect diversification and 100 is all suppliers in a single country.' },
        { term: 'Spend vs. supplier count', def: 'When your data includes annual spend figures, we weight by spend rather than headcount — a $2M supplier in China is a bigger exposure than a $50K supplier in Germany.' },
      ]} />

      <Callout type="info">
        Example: 50 suppliers with 18 in China (36%) → HHI ≈ 0.208 → Geographic score ≈ 46 (HIGH). After redistributing 6 suppliers out of China → score drops to ≈ 32 (MODERATE).
      </Callout>
    </Card>
  )
}

// ─── Section 3: Country Risk ──────────────────────────────────────────────────

function CountryRiskSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Component 2 · 30% weight"
        title="Country Risk"
        subtitle="Captures the inherent risk of operating in each country across three independent dimensions — not just political instability."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { icon: '🏛️', label: 'Political', weight: '40%', color: 'bg-red-50 border-red-100',
            desc: 'Government stability, rule of law, control of corruption, regulatory quality. High scores indicate unpredictable policy environments where export controls, nationalisation, or sudden regulatory changes are plausible.' },
          { icon: '🌋', label: 'Natural Hazard', weight: '35%', color: 'bg-orange-50 border-orange-100',
            desc: 'Earthquake, flood, typhoon, wildfire exposure. Based on historical event frequency and economic impact. High-hazard countries can disrupt supply chains even without any political trigger.' },
          { icon: '📦', label: 'Trade', weight: '25%', color: 'bg-blue-50 border-blue-100',
            desc: 'Export restriction history, sanctions exposure, tariff volatility, logistics infrastructure quality. Captures how reliably goods can actually move out of the country.' },
        ].map(f => (
          <div key={f.label} className={`rounded-xl border p-4 ${f.color}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{f.icon}</span>
              <span className="text-sm font-bold text-slate-900">{f.label}</span>
              <span className="ml-auto text-xs font-bold text-slate-400">{f.weight}</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </div>

      <FormulaBlock>
        Country Composite = 0.40 × Political + 0.35 × Hazard + 0.25 × Trade{'\n\n'}
        Country Risk Score = Σ (supplier_weight_i × composite_i)
      </FormulaBlock>

      <DefList items={[
        { term: 'Supplier weighting', def: 'Each country\'s composite score is weighted by that country\'s share of your total supplier count (or spend, when available). A riskier country with more of your suppliers drags the score up more.' },
        { term: 'Unknown countries', def: 'Countries not in our dataset receive a default composite of 50 — the midpoint — rather than 0, which would artificially lower your score.' },
        { term: 'Score examples', def: 'Singapore ≈ 9.6 (stable, low hazard, open trade), China ≈ 52.7 (moderate political, active export controls), Russia ≈ 60.7 (high political risk, extensive sanctions).' },
      ]} />
    </Card>
  )
}

// ─── Section 4: Disruption ────────────────────────────────────────────────────

function DisruptionSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Component 3 · 20% weight"
        title="Disruption Exposure"
        subtitle="Matches a curated set of recent real-world events against your specific supplier countries, then weights them by severity and recency."
      />

      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        Unlike the other components — which are calculated from static country profiles — disruption exposure is event-driven. We maintain a dataset of 35+ hand-curated events spanning trade policy changes, natural disasters, labor actions, geopolitical conflicts, and infrastructure failures.
      </p>

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Severity scoring</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { level: 'Critical', score: 25, color: '#EF4444', eg: 'Export bans, major port closures, armed conflict' },
            { level: 'High',     score: 15, color: '#F97316', eg: 'Sanctions, major floods, prolonged strikes' },
            { level: 'Medium',   score: 8,  color: '#F59E0B', eg: 'Regulatory changes, localized disasters' },
            { level: 'Low',      score: 3,  color: '#22C55E', eg: 'Minor disruptions, early-stage disputes' },
          ].map(s => (
            <div key={s.level} className="rounded-lg border border-slate-100 p-3 bg-slate-50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold" style={{ color: s.color }}>{s.level}</span>
                <span className="text-lg font-bold text-slate-300">+{s.score}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-snug">{s.eg}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Time decay</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-semibold text-slate-700 text-xs">Event age</th>
                <th className="text-left py-2 pr-4 font-semibold text-slate-700 text-xs">Multiplier</th>
                <th className="text-left py-2 font-semibold text-slate-700 text-xs">Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              <tr>
                <td className="py-2.5 pr-4">≤ 90 days</td>
                <td className="py-2.5 pr-4 font-bold text-slate-900">1.0×</td>
                <td className="py-2.5">Full weight — event is recent and supply chains are still adjusting.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">91 – 180 days</td>
                <td className="py-2.5 pr-4 font-bold text-slate-900">0.5×</td>
                <td className="py-2.5">Half weight — disruption is real but many supply chains have rerouted.</td>
              </tr>
              <tr>
                <td className="py-2.5 pr-4">&gt; 180 days</td>
                <td className="py-2.5 pr-4 font-bold text-slate-900">0.25×</td>
                <td className="py-2.5">Quarter weight — event is historical context, not active crisis.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <FormulaBlock>
        {`Event contribution = Severity score × Time decay multiplier\n\nDisruption Score = min(Σ matched contributions, 100)`}
      </FormulaBlock>

      <Callout type="note">
        Only events that overlap with your specific supplier countries are counted. A typhoon in the Philippines only affects your score if you have suppliers there.
      </Callout>
    </Card>
  )
}

// ─── Section 5: Single-source ─────────────────────────────────────────────────

function SingleSourceSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Component 4 · 15% weight"
        title="Single-Source Risk"
        subtitle="Identifies commodity categories where you have dangerously few qualified suppliers — a structural vulnerability independent of geography or country risk."
      />

      <p className="text-sm text-slate-600 leading-relaxed mb-5">
        Geographic concentration and country risk capture <em>where</em> your suppliers are. Single-source risk captures <em>how many</em> you have per category. Even a perfectly diversified geographic footprint collapses if you have only one qualified supplier for a critical component.
      </p>

      <div className="mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Scoring table</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2 pr-4 font-semibold text-slate-700 text-xs">Qualified suppliers</th>
                <th className="text-left py-2 pr-4 font-semibold text-slate-700 text-xs">Category score</th>
                <th className="text-left py-2 font-semibold text-slate-700 text-xs">Interpretation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {[
                ['1',  '100', '#EF4444', 'Single point of failure. Any disruption halts production immediately.'],
                ['2',  '50',  '#F97316', 'Fragile. One disruption removes your only backup.'],
                ['3',  '20',  '#F59E0B', 'Thin. A two-event scenario leaves you with a sole supplier.'],
                ['4+', '5',   '#22C55E', 'Healthy. Multiple alternatives exist.'],
              ].map(([n, score, color, note]) => (
                <tr key={n}>
                  <td className="py-2.5 pr-4 font-mono">{n}</td>
                  <td className="py-2.5 pr-4">
                    <span className="font-bold" style={{ color }}>{score}</span>
                  </td>
                  <td className="py-2.5">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <FormulaBlock>
        Single-Source Score = max(category score) across all commodity categories
      </FormulaBlock>

      <DefList items={[
        { term: 'Why take the maximum?', def: 'The highest single-source vulnerability determines this component\'s contribution. Having one sole-sourced critical component is dangerous regardless of how well-diversified your other categories are.' },
        { term: 'Requires commodity data', def: 'This component is only calculated if your supplier data includes a commodity or category column. If not present, the component scores 0 and is excluded from the overall calculation.' },
        { term: 'Criticality weighting', def: 'Future versions will weight by component criticality — a sole-sourced commodity for a non-critical packaging item should score lower than a sole-sourced semiconductor.' },
      ]} />
    </Card>
  )
}

// ─── Section 6: Data Sources ──────────────────────────────────────────────────

const SOURCES = [
  {
    name: 'World Bank Governance Indicators',
    provides: 'Political stability, rule of law, regulatory quality, control of corruption scores per country.',
    frequency: 'Annual',
    url: 'https://info.worldbank.org/governance/wgi/',
  },
  {
    name: 'EM-DAT International Disaster Database',
    provides: 'Historical natural disaster frequency, economic impact, and geographic risk exposure.',
    frequency: 'Quarterly',
    url: 'https://www.emdat.be/',
  },
  {
    name: 'OFAC Sanctions List',
    provides: 'Active US economic sanctions and trade restrictions by country and entity.',
    frequency: 'Real-time (static snapshot in this tool)',
    url: 'https://ofac.treasury.gov/sanctions-list-search',
  },
  {
    name: 'World Bank Logistics Performance Index',
    provides: 'Trade logistics infrastructure quality, customs efficiency, and shipment tracking reliability.',
    frequency: 'Every 2 years',
    url: 'https://lpi.worldbank.org/',
  },
  {
    name: 'Curated industry events',
    provides: '35+ hand-curated supply chain disruptions (2025–2026): trade policies, disasters, labor actions, geopolitical events.',
    frequency: 'Manually updated',
    url: 'https://github.com/vyj_yang/supplylens',
  },
]

function DataSourcesSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Data Provenance"
        title="Our Data Sources"
        subtitle="All data is sourced from public, authoritative sources. Country risk scores are pre-computed and bundled with the app — no API calls are made."
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-slate-200">
              <th className="text-left py-3 pr-4 font-semibold text-slate-700 text-xs uppercase tracking-wide w-48">Source</th>
              <th className="text-left py-3 pr-4 font-semibold text-slate-700 text-xs uppercase tracking-wide">Provides</th>
              <th className="text-left py-3 pr-4 font-semibold text-slate-700 text-xs uppercase tracking-wide w-36">Update freq.</th>
              <th className="text-left py-3 font-semibold text-slate-700 text-xs uppercase tracking-wide w-16">Link</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SOURCES.map(s => (
              <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                <td className="py-3 pr-4 font-semibold text-slate-800 text-xs align-top leading-snug">{s.name}</td>
                <td className="py-3 pr-4 text-slate-500 text-xs align-top leading-relaxed">{s.provides}</td>
                <td className="py-3 pr-4 text-slate-400 text-xs align-top">{s.frequency}</td>
                <td className="py-3 align-top">
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-xs font-medium inline-flex items-center gap-0.5"
                    aria-label={`Visit ${s.name}`}
                  >
                    ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ─── Section 7: Limitations ───────────────────────────────────────────────────

const LIMITATIONS = [
  { icon: '💰', title: 'No financial health data', desc: 'We don\'t assess whether your suppliers are financially solvent. A geographically diversified supplier that\'s about to go bankrupt won\'t be flagged.' },
  { icon: '🔗', title: 'No sub-tier visibility', desc: 'We only see your direct (tier-1) suppliers. Your tier-2 and tier-3 suppliers — and their concentrations — are invisible to this tool.' },
  { icon: '⏱️', title: 'No real-time monitoring', desc: 'Risk scores are calculated at the time you load your data. New events or country changes are not automatically pushed to you.' },
  { icon: '📍', title: 'Country-level only, not city-level', desc: 'We treat all suppliers in China as equivalent. A supplier in Shenzhen and one in Xinjiang have different risk profiles — this tool doesn\'t distinguish them.' },
  { icon: '🔮', title: 'No predictive modeling', desc: 'Scores reflect current and recent conditions, not forecasts. We don\'t predict which countries are about to become riskier.' },
  { icon: '🏭', title: 'No capacity or lead-time data', desc: 'We don\'t know how quickly a disruption would actually hit your production — that depends on safety stock, lead times, and demand that only you know.' },
  { icon: '🌐', title: 'Curated events, not exhaustive', desc: 'The disruption feed covers 35+ events curated by hand. Real-world events between updates won\'t appear until the next dataset refresh.' },
]

function LimitationsSection() {
  return (
    <Card>
      <SectionHeading
        eyebrow="Honest Assessment"
        title="Limitations & What This Score Doesn't Capture"
        subtitle="Good risk tools are upfront about what they can't see. Here's what SupplyLens doesn't know."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {LIMITATIONS.map(l => (
          <div key={l.title} className="flex gap-3 p-4 rounded-lg bg-slate-50 border border-slate-100">
            <span className="text-xl shrink-0">{l.icon}</span>
            <div>
              <p className="text-sm font-semibold text-slate-800 mb-1">{l.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{l.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <Callout type="warning">
        <strong>Important disclaimer:</strong> SupplyLens provides a screening-level risk assessment based on publicly available data. It is not a substitute for professional supply chain risk management, supplier audits, or dedicated risk management platforms. Scores should be used as a starting point for conversation, not as definitive risk ratings.
      </Callout>
    </Card>
  )
}

// ─── Section 8: Feedback ─────────────────────────────────────────────────────

function FeedbackSection() {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0 text-2xl">
          💬
        </div>
        <div className="flex-1">
          <h2 className="text-lg font-bold text-slate-900 mb-1">Questions or Feedback?</h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Found an error in the data? Think a weight is wrong? Have a use case we haven't considered?
            Open an issue on GitHub — all feedback is welcome.
          </p>
        </div>
        <a
          href="https://github.com/vyj_yang/supplylens/issues"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          Open an Issue
        </a>
      </div>
    </Card>
  )
}

// ─── Table of contents sidebar ────────────────────────────────────────────────

const TOC_ITEMS = [
  { href: '#overview',      label: 'Score Overview' },
  { href: '#geographic',    label: 'Geographic Concentration' },
  { href: '#country-risk',  label: 'Country Risk' },
  { href: '#disruption',    label: 'Disruption Exposure' },
  { href: '#single-source', label: 'Single-Source Risk' },
  { href: '#data-sources',  label: 'Data Sources' },
  { href: '#limitations',   label: 'Limitations' },
  { href: '#feedback',      label: 'Feedback' },
]

function TableOfContents() {
  return (
    <nav aria-label="Page contents" className="hidden xl:block sticky top-24 self-start">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 pl-1">Contents</p>
      <ul className="space-y-1">
        {TOC_ITEMS.map(item => (
          <li key={item.href}>
            <a
              href={item.href}
              className="block px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

// ─── MethodologyPage ──────────────────────────────────────────────────────────

export default function MethodologyPage() {
  return (
    <div className="bg-background min-h-screen">
      <div className="max-w-content mx-auto px-6 py-10">

        {/* Back link + page header */}
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5" aria-hidden>
              <path fillRule="evenodd" d="M14 8a.75.75 0 01-.75.75H4.56l3.22 3.22a.75.75 0 11-1.06 1.06l-4.5-4.25a.75.75 0 010-1.06l4.5-4.25a.75.75 0 011.06 1.06L4.56 7.25H13.25A.75.75 0 0114 8z" clipRule="evenodd"/>
            </svg>
            Back to Dashboard
          </Link>

          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Methodology</h1>
          <p className="mt-2 text-slate-500 max-w-2xl">
            How SupplyLens calculates risk — the formulas, the data, the design choices, and the honest limitations.
          </p>
        </div>

        {/* Two-column layout: content + sticky ToC */}
        <div className="flex gap-12 items-start">

          {/* Main content */}
          <div className="flex-1 min-w-0 space-y-6">
            <Section id="overview">       <ScoreOverview />      </Section>
            <Section id="geographic">     <GeographicSection />  </Section>
            <Section id="country-risk">   <CountryRiskSection /> </Section>
            <Section id="disruption">     <DisruptionSection />  </Section>
            <Section id="single-source">  <SingleSourceSection /></Section>
            <Section id="data-sources">   <DataSourcesSection /> </Section>
            <Section id="limitations">    <LimitationsSection /> </Section>
            <Section id="feedback">       <FeedbackSection />    </Section>
          </div>

          {/* Sticky ToC — xl+ screens */}
          <div className="w-48 shrink-0">
            <TableOfContents />
          </div>
        </div>

      </div>
    </div>
  )
}
