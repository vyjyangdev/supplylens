/**
 * Pure risk calculation functions. No React dependencies — data in, scores out.
 * All functions that need country lookup receive it via the normalizeCountry import;
 * all static data (country risk scores, events, metadata) is passed as parameters.
 */

import {
  WEIGHTS,
  SEVERITY_SCORES,
  TIME_DECAY_DAYS,
  TIME_DECAY_MULTIPLIERS,
  SINGLE_SOURCE_SCORES,
  SINGLE_SOURCE_DEFAULT_SCORE,
  RISK_THRESHOLDS,
} from '../constants/riskThresholds.js'
import { normalizeCountry } from './countryNormalizer.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Aggregate suppliers into { [country]: { count, spend } } */
function aggregateByCountry(suppliers) {
  const totals = {}
  for (const s of suppliers) {
    const key = s.country || 'Unknown'
    if (!totals[key]) totals[key] = { count: 0, spend: 0 }
    totals[key].count++
    totals[key].spend += s.annualSpend ?? 0
  }
  return totals
}

/** Returns true when every supplier has a positive annualSpend */
function hasSpendData(suppliers) {
  return suppliers.length > 0 && suppliers.every(s => s.annualSpend != null && s.annualSpend > 0)
}

// ─── getRiskLevel ─────────────────────────────────────────────────────────────

/**
 * Map a 0–100 score to a risk label.
 * @returns {'LOW'|'MODERATE'|'HIGH'|'CRITICAL'}
 */
export function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL) return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH)     return 'HIGH'
  if (score >= RISK_THRESHOLDS.MODERATE) return 'MODERATE'
  return 'LOW'
}

// ─── calculateHHI ─────────────────────────────────────────────────────────────

/**
 * Herfindahl-Hirschman Index of geographic concentration, normalized to 0–100.
 *
 * Uses annualSpend weighting when available (preferred — reflects monetary exposure),
 * falls back to supplier count otherwise.
 *
 * Normalization: sqrt(HHI) × 100 maps the raw [0,1] HHI to [0,100] with a
 * convex curve that gives intuitive scores — e.g. 36% in one country → ~42,
 * 100% in one country → 100, perfect diversification → near 0.
 */
export function calculateHHI(suppliers) {
  if (!suppliers.length) return 0

  const useSpend = hasSpendData(suppliers)
  const totals = aggregateByCountry(suppliers)
  const grandTotal = Object.values(totals).reduce(
    (sum, t) => sum + (useSpend ? t.spend : t.count),
    0,
  )
  if (grandTotal === 0) return 0

  let hhi = 0
  for (const t of Object.values(totals)) {
    const value = useSpend ? t.spend : t.count
    const share = value / grandTotal
    hhi += share * share
  }

  return Math.min(Math.sqrt(hhi) * 100, 100)
}

// ─── calculateGeographicScore ─────────────────────────────────────────────────

/**
 * Geographic concentration risk.
 * @returns {{ score: number, breakdown: Array }}
 *   breakdown: [{ country, count, percentage, spendShare, riskLevel }] sorted by count desc
 */
export function calculateGeographicScore(suppliers) {
  if (!suppliers.length) return { score: 0, breakdown: [] }

  const useSpend = hasSpendData(suppliers)
  const totals   = aggregateByCountry(suppliers)
  const total    = suppliers.length
  const grandSpend = suppliers.reduce((s, x) => s + (x.annualSpend ?? 0), 0)

  const score = calculateHHI(suppliers)

  const breakdown = Object.entries(totals)
    .map(([country, { count, spend }]) => ({
      country,
      count,
      percentage:  Math.round((count / total) * 100),
      spendShare:  grandSpend > 0 ? Math.round((spend / grandSpend) * 100) : null,
      riskLevel:   getRiskLevel((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  return { score, breakdown }
}

// ─── calculateCountryRiskScore ────────────────────────────────────────────────

/**
 * Spend-weighted (or count-weighted) average of country composite risk scores.
 * @param {Object} countryRiskData  keyed by ISO3 → { composite, factors, … }
 * @returns {{ score: number, topRiskCountries: Array }}
 */
export function calculateCountryRiskScore(suppliers, countryRiskData) {
  if (!suppliers.length) return { score: 0, topRiskCountries: [] }

  const useSpend   = hasSpendData(suppliers)
  const totals     = aggregateByCountry(suppliers)
  const grandTotal = Object.values(totals).reduce(
    (sum, t) => sum + (useSpend ? t.spend : t.count),
    0,
  )

  let weightedScore = 0
  const countryDetails = []

  for (const [country, { count, spend }] of Object.entries(totals)) {
    const iso3      = normalizeCountry(country)
    const riskEntry = iso3 ? countryRiskData[iso3] : null
    const composite = riskEntry?.composite ?? 50  // unknown country → medium default
    const weight    = (useSpend ? spend : count) / grandTotal

    weightedScore += composite * weight

    countryDetails.push({
      country,
      iso3,
      supplierCount: count,
      weightPercent: Math.round(weight * 100),
      composite: riskEntry ? composite : null,
      political: riskEntry?.political ?? null,
      hazard:    riskEntry?.hazard    ?? null,
      trade:     riskEntry?.trade     ?? null,
      factors:   riskEntry?.factors   ?? [],
    })
  }

  countryDetails.sort((a, b) => (b.composite ?? 0) - (a.composite ?? 0))

  return {
    score:            Math.round(weightedScore * 10) / 10,
    topRiskCountries: countryDetails.slice(0, 6),
  }
}

// ─── calculateDisruptionScore ─────────────────────────────────────────────────

/**
 * Match events against supplier countries, apply severity score + time decay, cap at 100.
 * @param {Array}  events           from events.json
 * @param {Array}  _countryMetadata optional; country lookup is handled via normalizeCountry
 * @returns {{ score: number, matchedEvents: Array }}
 */
export function calculateDisruptionScore(suppliers, events, _countryMetadata = []) {
  if (!suppliers.length || !events?.length) return { score: 0, matchedEvents: [] }

  // Supplier country ISO3 set for O(1) membership tests
  const supplierIso3s = new Set(
    suppliers.map(s => normalizeCountry(s.country)).filter(Boolean),
  )

  const today = new Date()
  let totalRaw = 0
  const matchedEvents = []

  for (const event of events) {
    const eventCountries = event.countries ?? []
    if (!eventCountries.some(iso3 => supplierIso3s.has(iso3))) continue

    const daysAgo = Math.max(
      0,
      Math.floor((today - new Date(event.date)) / 86_400_000),
    )

    const decay =
      daysAgo <= TIME_DECAY_DAYS.recent ? TIME_DECAY_MULTIPLIERS.recent :
      daysAgo <= TIME_DECAY_DAYS.medium ? TIME_DECAY_MULTIPLIERS.medium :
                                          TIME_DECAY_MULTIPLIERS.old

    const baseScore   = SEVERITY_SCORES[event.severity] ?? 0
    const contribution = baseScore * decay
    totalRaw += contribution

    matchedEvents.push({
      ...event,
      daysAgo,
      decay,
      contribution: Math.round(contribution * 10) / 10,
    })
  }

  matchedEvents.sort((a, b) => b.contribution - a.contribution)

  return {
    score:         Math.min(Math.round(totalRaw), 100),
    matchedEvents,
  }
}

// ─── calculateSingleSourceScore ───────────────────────────────────────────────

/**
 * Identify commodities with dangerously few suppliers.
 * Score = max across categories: 1 supplier→100, 2→50, 3→20, 4+→5.
 * @returns {{ score: number, singleSourceCategories: Array, noDataProvided: boolean }}
 */
export function calculateSingleSourceScore(suppliers) {
  if (!suppliers.length) {
    return { score: 0, singleSourceCategories: [], noDataProvided: true }
  }

  const hasCommodity = suppliers.some(s => s.commodity)
  if (!hasCommodity) {
    return { score: 0, singleSourceCategories: [], noDataProvided: true }
  }

  const byCommodity = {}
  for (const s of suppliers) {
    if (!s.commodity) continue
    byCommodity[s.commodity] = (byCommodity[s.commodity] ?? 0) + 1
  }

  const categories = Object.entries(byCommodity)
    .map(([commodity, supplierCount]) => ({
      commodity,
      supplierCount,
      score: SINGLE_SOURCE_SCORES[supplierCount] ?? SINGLE_SOURCE_DEFAULT_SCORE,
    }))
    .sort((a, b) => b.score - a.score || a.supplierCount - b.supplierCount)

  const maxScore = categories.length > 0 ? categories[0].score : 0
  const singleSourceCategories = categories.filter(c => c.score > SINGLE_SOURCE_DEFAULT_SCORE)

  return { score: maxScore, singleSourceCategories, noDataProvided: false }
}

// ─── calculateOverallRisk ─────────────────────────────────────────────────────

/**
 * Orchestrator — runs all four sub-scores and applies CLAUDE.md weights.
 * 0.35 × Geographic + 0.30 × Country + 0.20 × Disruption + 0.15 × SingleSource
 *
 * @returns {{
 *   overallScore:  number,
 *   riskLevel:     string,
 *   components:    Object,
 *   topRisks:      Array,
 * }}
 */
export function calculateOverallRisk(suppliers, countryRiskData, events, countryMetadata) {
  if (!suppliers?.length) {
    return { overallScore: 0, riskLevel: 'LOW', components: {}, topRisks: [] }
  }

  const geo         = calculateGeographicScore(suppliers)
  const country     = calculateCountryRiskScore(suppliers, countryRiskData)
  const disruption  = calculateDisruptionScore(suppliers, events, countryMetadata)
  const singleSrc   = calculateSingleSourceScore(suppliers)

  const overallScore = Math.round(
    WEIGHTS.geographic   * geo.score      +
    WEIGHTS.country      * country.score  +
    WEIGHTS.disruption   * disruption.score +
    WEIGHTS.singleSource * singleSrc.score,
  )

  const components = {
    geographic:   { score: Math.round(geo.score),      weight: WEIGHTS.geographic,   detail: geo },
    country:      { score: country.score,              weight: WEIGHTS.country,      detail: country },
    disruption:   { score: disruption.score,           weight: WEIGHTS.disruption,   detail: disruption },
    singleSource: { score: singleSrc.score,            weight: WEIGHTS.singleSource, detail: singleSrc },
  }

  return {
    overallScore,
    riskLevel: getRiskLevel(overallScore),
    components,
    topRisks: generateTopRisks(components, suppliers),
  }
}

// ─── generateTopRisks ────────────────────────────────────────────────────────

/**
 * Produce 3–5 human-readable risk findings with actionable recommendations.
 * Uses template functions to build description strings — no raw concatenation.
 */
export function generateTopRisks(components, suppliers) {
  const risks = []

  // 1. Geographic concentration
  const breakdown = components.geographic?.detail?.breakdown ?? []
  const geoScore  = components.geographic?.score ?? 0
  const topCountry = breakdown[0]
  if (topCountry && geoScore >= RISK_THRESHOLDS.MODERATE) {
    risks.push({
      type:     'geographic',
      severity: getRiskLevel(geoScore),
      title:    buildGeoTitle(topCountry),
      description: buildGeoDescription(topCountry, suppliers.length),
      recommendation: buildGeoRecommendation(topCountry),
    })
  }

  // 2. Single-source commodities (worst first, max 2)
  const singleSrcDetail = components.singleSource?.detail ?? {}
  const criticalSingles = (singleSrcDetail.singleSourceCategories ?? [])
    .filter(c => c.supplierCount === 1)
    .slice(0, 2)

  for (const cat of criticalSingles) {
    risks.push({
      type:        'single_source',
      severity:    'CRITICAL',
      title:       `Single source: ${cat.commodity}`,
      description: buildSingleSourceDescription(cat.commodity),
      recommendation: buildSingleSourceRecommendation(cat.commodity),
    })
  }

  // 3. Active high-impact disruptions
  const topEvents = (components.disruption?.detail?.matchedEvents ?? [])
    .filter(e => e.severity === 'critical' || e.severity === 'high')
    .slice(0, 2)

  for (const event of topEvents) {
    if (risks.length >= 5) break
    risks.push({
      type:        'disruption',
      severity:    eventSeverityToRiskLevel(event.severity),
      title:       event.title,
      description: firstSentence(event.description),
      recommendation: buildDisruptionRecommendation(event),
    })
  }

  // 4. Highest-risk country (if not already captured above)
  const topRiskCountries = components.country?.detail?.topRiskCountries ?? []
  const highRiskCountry  = topRiskCountries.find(c => (c.composite ?? 0) >= 50)
  if (highRiskCountry && risks.length < 5) {
    const alreadyCovered = risks.some(r =>
      r.type === 'geographic' &&
      r.title.toLowerCase().includes(highRiskCountry.country.toLowerCase()),
    )
    if (!alreadyCovered) {
      risks.push({
        type:        'country_risk',
        severity:    getRiskLevel(highRiskCountry.composite ?? 0),
        title:       buildCountryRiskTitle(highRiskCountry),
        description: buildCountryRiskDescription(highRiskCountry),
        recommendation: buildCountryRiskRecommendation(highRiskCountry),
      })
    }
  }

  return risks.slice(0, 5)
}

// ─── Template builder functions (no string concatenation) ─────────────────────

function buildGeoTitle({ country, percentage }) {
  return `${country} concentration — ${percentage}% of supply base`
}

function buildGeoDescription({ country, count, percentage }, totalSuppliers) {
  return (
    `${count} of your ${totalSuppliers} suppliers (${percentage}%) are located in ${country}. ` +
    `A trade restriction, regulatory action, or natural disaster there could simultaneously ` +
    `affect ${percentage}% of your supplier network with no automatic fallback.`
  )
}

function buildGeoRecommendation({ country, count }) {
  const target = Math.max(2, Math.ceil(count * 0.25))
  return (
    `Qualify at least ${target} alternative suppliers outside ${country} for your ` +
    `highest-criticality ${country}-sourced commodities. Prioritise Vietnam, Mexico, ` +
    `or India as nearshore or China+1 alternatives.`
  )
}

function buildSingleSourceDescription(commodity) {
  return (
    `You have exactly one qualified supplier for ${commodity}. Any disruption — ` +
    `financial distress, export control action, natural disaster, or capacity shortfall — ` +
    `would immediately halt your ${commodity} supply with no qualified alternative in place.`
  )
}

function buildSingleSourceRecommendation(commodity) {
  return (
    `Immediately initiate qualification of a second-source supplier for ${commodity}. ` +
    `Target a 90-day qualification timeline. Build 12–16 weeks of safety stock as an ` +
    `interim buffer while the second source is being qualified.`
  )
}

function buildDisruptionRecommendation(event) {
  const countries = (event.countries ?? []).join(', ')
  return (
    `Review your supplier exposure in ${countries} for this event. Request business ` +
    `continuity plan documentation from affected suppliers and assess whether airfreight ` +
    `or alternate routing can bridge any near-term gap.`
  )
}

function buildCountryRiskTitle({ country, composite }) {
  return `Elevated country risk: ${country} (${composite}/100)`
}

function buildCountryRiskDescription({ country, composite, factors }) {
  const leadFactor = factors?.[0]
  const factorClause = leadFactor ? ` Key driver: ${leadFactor}.` : ''
  return `${country} carries a composite country risk score of ${composite}/100.${factorClause}`
}

function buildCountryRiskRecommendation({ country }) {
  return (
    `Request updated business continuity plans from your ${country}-based suppliers. ` +
    `Assess which commodities sourced from ${country} lack a qualified backup supplier ` +
    `and prioritise those for dual-sourcing initiatives.`
  )
}

function eventSeverityToRiskLevel(severity) {
  return { critical: 'CRITICAL', high: 'HIGH', medium: 'MODERATE', low: 'LOW' }[severity] ?? 'MODERATE'
}

function firstSentence(text) {
  if (!text) return ''
  const match = text.match(/^[^.!?]+[.!?]/)
  return match ? match[0] : text.slice(0, 200)
}
