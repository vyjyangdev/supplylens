import { useMemo } from 'react'
import { useSupplierData } from '../hooks/useSupplierData'
import { calculateOverallRisk } from '../utils/riskCalculations'
import { normalizeCountry } from '../utils/countryNormalizer'
import countryRiskScores from '../data/country-risk-scores.json'
import countryMetadata from '../data/country-metadata.json'
import events from '../data/events.json'

export default function useRiskScore() {
  const { suppliers } = useSupplierData()

  const risk = useMemo(
    () => calculateOverallRisk(suppliers, countryRiskScores, events, countryMetadata),
    [suppliers],
  )

  const enrichedBreakdown = useMemo(() => {
    const breakdown = risk.components?.geographic?.detail?.breakdown ?? []
    return breakdown.map((row) => ({
      ...row,
      composite: countryRiskScores[normalizeCountry(row.country)]?.composite ?? null,
    }))
  }, [risk])

  return {
    overallScore:      risk.overallScore,
    riskLevel:         risk.riskLevel,
    components:        risk.components,
    topRisks:          risk.topRisks,
    enrichedBreakdown,
    hhi:               risk.components?.geographic?.score ?? 0,
    matchedEvents:     risk.components?.disruption?.detail?.matchedEvents ?? [],
  }
}
