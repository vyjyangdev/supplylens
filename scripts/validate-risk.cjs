/**
 * Standalone validation of the risk calculation logic against sample data.
 * CommonJS — no ESM JSON import complications.
 * Run: node scripts/validate-risk.cjs
 */

'use strict'

const path = require('path')
const root = path.join(__dirname, '..')

const suppliers     = require(path.join(root, 'src/data/sample-suppliers.json'))
const countryRisk   = require(path.join(root, 'src/data/country-risk-scores.json'))
const events        = require(path.join(root, 'src/data/events.json'))
const metadata      = require(path.join(root, 'src/data/country-metadata.json'))

// ─── Constants (mirrors riskThresholds.js) ────────────────────────────────────

const WEIGHTS            = { geographic: 0.35, country: 0.30, disruption: 0.20, singleSource: 0.15 }
const SEVERITY_SCORES    = { critical: 25, high: 15, medium: 8, low: 3 }
const TIME_DECAY_DAYS    = { recent: 90, medium: 180 }
const TIME_DECAY_MULT    = { recent: 1.00, medium: 0.50, old: 0.25 }
const SINGLE_SRC_SCORES  = { 1: 100, 2: 50, 3: 20 }
const SINGLE_SRC_DEFAULT = 5
const RISK_THRESHOLDS    = { MODERATE: 30, HIGH: 55, CRITICAL: 75 }

// ─── Country normalizer (mirrors countryNormalizer.js) ────────────────────────

const lookupMap = new Map()
for (const entry of metadata) {
  const add = (v) => v != null && lookupMap.set(String(v).toLowerCase().trim(), entry.iso3)
  add(entry.iso3); add(entry.iso2); add(entry.name)
  ;(entry.nameVariants || []).forEach(add)
}
function normalizeCountry(input) {
  if (input == null) return null
  const key = String(input).toLowerCase().trim()
  return key ? (lookupMap.get(key) || null) : null
}

// ─── getRiskLevel ─────────────────────────────────────────────────────────────

function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH)     return 'HIGH'
  if (score >= RISK_THRESHOLDS.MODERATE) return 'MODERATE'
  return 'LOW'
}

// ─── calculateHHI ─────────────────────────────────────────────────────────────

function calculateHHI(sups) {
  if (!sups.length) return 0
  const useSpend = sups.every(s => s.annualSpend != null && s.annualSpend > 0)
  const totals = {}
  let grand = 0
  for (const s of sups) {
    const key = s.country || 'Unknown'
    const val = useSpend ? s.annualSpend : 1
    totals[key] = (totals[key] || 0) + val
    grand += val
  }
  if (!grand) return 0
  let hhi = 0
  for (const v of Object.values(totals)) { const sh = v / grand; hhi += sh * sh }
  return Math.min(Math.sqrt(hhi) * 100, 100)
}

// ─── calculateGeographicScore ─────────────────────────────────────────────────

function calculateGeographicScore(sups) {
  const score = calculateHHI(sups)
  const totals = {}
  const grandSpend = sups.reduce((s, x) => s + (x.annualSpend || 0), 0)
  for (const s of sups) {
    const k = s.country || 'Unknown'
    if (!totals[k]) totals[k] = { count: 0, spend: 0 }
    totals[k].count++
    totals[k].spend += s.annualSpend || 0
  }
  const breakdown = Object.entries(totals)
    .map(([c, { count, spend }]) => ({
      country:    c,
      count,
      percentage: Math.round(count / sups.length * 100),
      spendShare: grandSpend > 0 ? Math.round(spend / grandSpend * 100) : null,
    }))
    .sort((a, b) => b.count - a.count)
  return { score, breakdown }
}

// ─── calculateCountryRiskScore ────────────────────────────────────────────────

function calculateCountryRiskScore(sups, riskData) {
  const useSpend = sups.every(s => s.annualSpend != null && s.annualSpend > 0)
  const totals = {}
  let grand = 0
  for (const s of sups) {
    const k = s.country || 'Unknown'
    if (!totals[k]) totals[k] = { count: 0, spend: 0 }
    totals[k].count++
    totals[k].spend += s.annualSpend || 0
    grand += useSpend ? s.annualSpend : 1
  }
  let weighted = 0
  const details = []
  for (const [country, { count, spend }] of Object.entries(totals)) {
    const iso3      = normalizeCountry(country)
    const entry     = iso3 ? riskData[iso3] : null
    const composite = entry ? entry.composite : 50
    const weight    = (useSpend ? spend : count) / grand
    weighted += composite * weight
    details.push({ country, iso3, supplierCount: count, composite, weightPercent: Math.round(weight * 100) })
  }
  details.sort((a, b) => (b.composite || 0) - (a.composite || 0))
  return { score: Math.round(weighted * 10) / 10, topRiskCountries: details.slice(0, 6) }
}

// ─── calculateDisruptionScore ─────────────────────────────────────────────────

function calculateDisruptionScore(sups, evts) {
  const supplierIso3s = new Set(sups.map(s => normalizeCountry(s.country)).filter(Boolean))
  const today = new Date()
  let totalRaw = 0
  const matched = []
  for (const e of evts) {
    if (!(e.countries || []).some(iso3 => supplierIso3s.has(iso3))) continue
    const daysAgo = Math.max(0, Math.floor((today - new Date(e.date)) / 86_400_000))
    const decay = daysAgo <= TIME_DECAY_DAYS.recent ? TIME_DECAY_MULT.recent
                : daysAgo <= TIME_DECAY_DAYS.medium ? TIME_DECAY_MULT.medium
                : TIME_DECAY_MULT.old
    const contribution = (SEVERITY_SCORES[e.severity] || 0) * decay
    totalRaw += contribution
    matched.push({ id: e.id, title: e.title, severity: e.severity, daysAgo, decay, contribution: Math.round(contribution * 10) / 10 })
  }
  matched.sort((a, b) => b.contribution - a.contribution)
  return { score: Math.min(Math.round(totalRaw), 100), matchedEvents: matched }
}

// ─── calculateSingleSourceScore ───────────────────────────────────────────────

function calculateSingleSourceScore(sups) {
  const byCommodity = {}
  for (const s of sups) {
    if (!s.commodity) continue
    byCommodity[s.commodity] = (byCommodity[s.commodity] || 0) + 1
  }
  const categories = Object.entries(byCommodity)
    .map(([commodity, n]) => ({ commodity, supplierCount: n, score: SINGLE_SRC_SCORES[n] || SINGLE_SRC_DEFAULT }))
    .sort((a, b) => b.score - a.score)
  return {
    score: categories.length ? categories[0].score : 0,
    singleSourceCategories: categories.filter(c => c.score > SINGLE_SRC_DEFAULT),
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

const geo     = calculateGeographicScore(suppliers)
const country = calculateCountryRiskScore(suppliers, countryRisk)
const disrupt = calculateDisruptionScore(suppliers, events)
const single  = calculateSingleSourceScore(suppliers)

const overallScore = Math.round(
  WEIGHTS.geographic   * geo.score     +
  WEIGHTS.country      * country.score +
  WEIGHTS.disruption   * disrupt.score +
  WEIGHTS.singleSource * single.score,
)

console.log('\n══════════════════════════════════════════════════════')
console.log('  SupplyLens — Risk Score Validation')
console.log('══════════════════════════════════════════════════════')
console.log(`\n  Overall Risk Score : ${overallScore} / 100  [${getRiskLevel(overallScore)}]`)
console.log(`  Expected range     : 60–65\n`)

console.log('  Component Scores:')
console.log(`    Geographic   (weight ${WEIGHTS.geographic})  : ${geo.score.toFixed(1)}  [${getRiskLevel(geo.score)}]`)
console.log(`    Country      (weight ${WEIGHTS.country})  : ${country.score}  [${getRiskLevel(country.score)}]`)
console.log(`    Disruption   (weight ${WEIGHTS.disruption})  : ${disrupt.score}  [${getRiskLevel(disrupt.score)}]`)
console.log(`    Single-source(weight ${WEIGHTS.singleSource})  : ${single.score}  [${getRiskLevel(single.score)}]`)

console.log('\n  Geographic Breakdown (top 5):')
for (const row of geo.breakdown.slice(0, 5)) {
  const flag = row.country === 'China' && row.count === 18 ? '  ✓ 18 suppliers as expected' : ''
  console.log(`    ${row.country.padEnd(18)} ${String(row.count).padStart(2)} suppliers  ${String(row.percentage).padStart(3)}%  spend: ${row.spendShare ?? '?'}%${flag}`)
}

console.log('\n  Top Country Risks:')
for (const c of country.topRiskCountries) {
  console.log(`    ${c.country.padEnd(18)} composite=${c.composite ?? 'n/a'}  weight=${c.weightPercent}%  iso3=${c.iso3 || 'NOT FOUND'}`)
}

console.log('\n  Single-Source Categories:')
for (const c of single.singleSourceCategories) {
  console.log(`    ${c.commodity.padEnd(22)} ${c.supplierCount} supplier(s)  score=${c.score}`)
}

console.log('\n  Matched Disruption Events (top 8):')
for (const e of disrupt.matchedEvents.slice(0, 8)) {
  console.log(`    [${e.severity.padEnd(8)}] decay=${e.decay}  +${String(e.contribution).padStart(5)}  ${e.title.slice(0, 55)}`)
}

console.log(`\n  Total matched events : ${disrupt.matchedEvents.length}`)
console.log(`  Raw disruption sum   : ${disrupt.matchedEvents.reduce((s, e) => s + e.contribution, 0).toFixed(1)} → capped at ${disrupt.score}`)

// Assertions
const PASS = '  ✓ PASS'
const FAIL = '  ✗ FAIL'
console.log('\n  Assertions:')
console.log((overallScore >= 60 && overallScore <= 65) ? PASS : FAIL, `Overall score in 60–65 range: ${overallScore}`)
console.log(geo.breakdown[0]?.country === 'China'                   ? PASS : FAIL, `China is #1 country by supplier count`)
console.log(geo.breakdown[0]?.count   === 18                        ? PASS : FAIL, `China has exactly 18 suppliers`)
console.log(geo.breakdown.length      === 12                        ? PASS : FAIL, `Exactly 12 unique countries`)
console.log(single.singleSourceCategories.some(c => c.commodity === 'Rare Earth Magnets' && c.supplierCount === 1) ? PASS : FAIL, `Rare Earth Magnets is single-source`)
console.log(single.singleSourceCategories.some(c => c.commodity === 'Battery Cells' && c.supplierCount === 1)      ? PASS : FAIL, `Battery Cells is single-source`)
console.log(disrupt.matchedEvents.length > 0                        ? PASS : FAIL, `At least 1 disruption event matched`)
console.log(country.topRiskCountries[0]?.country === 'China'        ? PASS : FAIL, `China is highest country-risk contributor`)

console.log('\n══════════════════════════════════════════════════════\n')
