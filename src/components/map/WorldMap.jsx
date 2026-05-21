import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
} from 'react-simple-maps'
import { scaleLinear } from 'd3-scale'
import countryMetadata from '../../data/country-metadata.json'
import countryRiskScores from '../../data/country-risk-scores.json'
import { normalizeCountry } from '../../utils/countryNormalizer'
import { RISK_THRESHOLDS } from '../../constants/riskThresholds'

// ─── TopoJSON source ──────────────────────────────────────────────────────────
// Bundled in /public so it loads from the same origin (no CDN dependency)
const GEO_URL = '/countries-110m.json'

// ─── ISO numeric → ISO3 mapping ───────────────────────────────────────────────
// world-atlas uses ISO 3166-1 numeric codes as string IDs.
// This table covers all 53 countries in our country-metadata.json plus common others.
const NUMERIC_TO_ISO3 = {
  '004': 'AFG', '008': 'ALB', '012': 'DZA', '024': 'AGO', '032': 'ARG',
  '036': 'AUS', '040': 'AUT', '050': 'BGD', '056': 'BEL', '068': 'BOL',
  '076': 'BRA', '100': 'BGR', '104': 'MMR', '116': 'KHM', '120': 'CMR',
  '124': 'CAN', '144': 'LKA', '152': 'CHL', '156': 'CHN', '170': 'COL',
  '180': 'COD', '188': 'CRI', '191': 'HRV', '192': 'CUB', '203': 'CZE',
  '204': 'BEN', '208': 'DNK', '218': 'ECU', '818': 'EGY', '222': 'SLV',
  '231': 'ETH', '246': 'FIN', '250': 'FRA', '276': 'DEU', '288': 'GHA',
  '300': 'GRC', '320': 'GTM', '332': 'HTI', '340': 'HND', '348': 'HUN',
  '356': 'IND', '360': 'IDN', '364': 'IRN', '368': 'IRQ', '372': 'IRL',
  '376': 'ISR', '380': 'ITA', '388': 'JAM', '392': 'JPN', '400': 'JOR',
  '398': 'KAZ', '404': 'KEN', '408': 'PRK', '410': 'KOR', '414': 'KWT',
  '422': 'LBN', '430': 'LBR', '434': 'LBY', '458': 'MYS', '484': 'MEX',
  '504': 'MAR', '508': 'MOZ', '516': 'NAM', '524': 'NPL', '528': 'NLD',
  '554': 'NZL', '566': 'NGA', '578': 'NOR', '586': 'PAK', '598': 'PNG',
  '604': 'PER', '608': 'PHL', '616': 'POL', '620': 'PRT', '630': 'PRI',
  '634': 'QAT', '642': 'ROU', '643': 'RUS', '682': 'SAU', '694': 'SLE',
  '703': 'SVK', '705': 'SVN', '706': 'SOM', '710': 'ZAF', '724': 'ESP',
  '729': 'SDN', '752': 'SWE', '756': 'CHE', '760': 'SYR', '764': 'THA',
  '800': 'UGA', '804': 'UKR', '784': 'ARE', '826': 'GBR', '840': 'USA',
  '858': 'URY', '860': 'UZB', '862': 'VEN', '704': 'VNM', '887': 'YEM',
  '894': 'ZMB', '716': 'ZWE', '158': 'TWN', '792': 'TUR',
}

// ─── Risk level from composite score ─────────────────────────────────────────
function getRiskLevel(score) {
  if (score >= RISK_THRESHOLDS.CRITICAL)  return 'CRITICAL'
  if (score >= RISK_THRESHOLDS.HIGH)      return 'HIGH'
  if (score >= RISK_THRESHOLDS.MODERATE)  return 'MODERATE'
  return 'LOW'
}

const RISK_BADGE_STYLES = {
  LOW:      'bg-emerald-100 text-emerald-700',
  MODERATE: 'bg-amber-100   text-amber-700',
  HIGH:     'bg-orange-100  text-orange-700',
  CRITICAL: 'bg-red-100     text-red-700',
}

// ─── Country name lookup from metadata ───────────────────────────────────────
const ISO3_TO_NAME = Object.fromEntries(
  countryMetadata.map(c => [c.iso3, c.name])
)

// ─── Color scale ──────────────────────────────────────────────────────────────
// Lightest blue → deepest blue across supplier count range
const EMPTY_FILL   = '#E2E8F0'   // slate-200 — no suppliers
const HOVER_STROKE = '#1D4ED8'   // blue-700
const STROKE       = 'none'

function buildColorScale(max) {
  // Guard: if max = 0 or 1 we still want a valid scale
  return scaleLinear()
    .domain([1, Math.max(max, 2)])
    .range(['#BFDBFE', '#1E40AF'])   // blue-200 → blue-800
    .clamp(true)
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function Tooltip({ data, position, total }) {
  if (!data) return null

  const { iso3, supplierCount, name } = data
  const riskEntry = countryRiskScores[iso3]
  const pct       = total > 0 ? ((supplierCount / total) * 100).toFixed(1) : '0.0'
  const level     = riskEntry ? getRiskLevel(riskEntry.composite) : null

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 min-w-[200px] rounded-xl bg-white border border-slate-200 shadow-xl p-4"
      style={{
        left: position.x + 14,
        top:  position.y - 10,
        // Prevent overflow past right edge — handled via CSS clamp below
        maxWidth: 240,
      }}
    >
      {/* Country name */}
      <p className="text-sm font-bold text-slate-900">{name}</p>

      {/* Supplier count + share */}
      <div className="mt-2 flex items-baseline justify-between gap-4">
        <span className="text-xs text-slate-500">Suppliers</span>
        <span className="text-sm font-semibold text-slate-900">
          {supplierCount} <span className="text-slate-400 font-normal">({pct}%)</span>
        </span>
      </div>

      {riskEntry && (
        <>
          {/* Composite risk score */}
          <div className="mt-1 flex items-baseline justify-between gap-4">
            <span className="text-xs text-slate-500">Risk score</span>
            <span className="text-sm font-semibold text-slate-900">
              {riskEntry.composite.toFixed(1)}
              <span className="text-xs text-slate-400 font-normal"> / 100</span>
            </span>
          </div>

          {/* Risk badge */}
          {level && (
            <div className="mt-2">
              <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_BADGE_STYLES[level]}`}>
                {level}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function MapLegend({ maxCount }) {
  const steps = [1, Math.ceil(maxCount / 3), Math.ceil((maxCount * 2) / 3), maxCount]
  const scale = buildColorScale(maxCount)

  return (
    <div className="flex items-center gap-3 mt-3">
      <span className="text-xs text-slate-500 shrink-0">Suppliers per country</span>
      <div className="flex items-center gap-1">
        {/* No-supplier swatch */}
        <div
          className="w-5 h-3 rounded-sm border border-slate-200"
          style={{ backgroundColor: EMPTY_FILL }}
          title="No suppliers"
        />
        {/* Gradient swatches */}
        {steps.map((n, i) => (
          <div
            key={i}
            className="w-5 h-3 rounded-sm"
            style={{ backgroundColor: scale(n) }}
            title={`${n} supplier${n !== 1 ? 's' : ''}`}
          />
        ))}
      </div>
      <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
        <span>0</span>
        <span>{maxCount}</span>
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function MapSkeleton() {
  return (
    <div className="w-full animate-pulse" style={{ paddingBottom: '52%', position: 'relative' }}>
      <div className="absolute inset-0 rounded-lg bg-slate-100 flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading map…</p>
        </div>
      </div>
    </div>
  )
}

// ─── WorldMap ─────────────────────────────────────────────────────────────────

/**
 * @param {object[]} suppliers   Array of supplier objects (each has a `.country` ISO3 field)
 */
export default function WorldMap({ suppliers = [] }) {
  const [tooltip,  setTooltip]  = useState(null)   // { data, position }
  const [geoReady, setGeoReady] = useState(false)

  // ── Derived: count suppliers by ISO3 country ──────────────────────────────

  const countByISO3 = useMemo(() => {
    const map = {}
    for (const s of suppliers) {
      if (!s.country) continue
      // Normalise to ISO3 so both sample data ("China") and uploaded
      // data (already "CHN") produce the same key format.
      const iso3 = normalizeCountry(s.country)
      if (iso3) map[iso3] = (map[iso3] ?? 0) + 1
    }
    return map
  }, [suppliers])

  const totalSuppliers = suppliers.length
  const maxCount = useMemo(
    () => Math.max(0, ...Object.values(countByISO3)),
    [countByISO3]
  )

  const colorScale = useMemo(() => buildColorScale(maxCount), [maxCount])

  // ── Tooltip handlers ──────────────────────────────────────────────────────

  const handleMouseEnter = useCallback((geo, evt) => {
    const numericId = geo.id ?? geo.properties?.id
    const iso3      = NUMERIC_TO_ISO3[String(numericId).padStart(3, '0')]
    if (!iso3) return

    const count = countByISO3[iso3]
    if (!count) return                         // no suppliers → no tooltip

    setTooltip({
      data: {
        iso3,
        name:          ISO3_TO_NAME[iso3] ?? iso3,
        supplierCount: count,
      },
      position: { x: evt.clientX, y: evt.clientY },
    })
  }, [countByISO3])

  const handleMouseMove = useCallback((geo, evt) => {
    setTooltip(prev =>
      prev ? { ...prev, position: { x: evt.clientX, y: evt.clientY } } : prev
    )
  }, [])

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  const handleClick = useCallback((geo) => {
    const numericId = geo.id ?? geo.properties?.id
    const iso3      = NUMERIC_TO_ISO3[String(numericId).padStart(3, '0')]
    // Future phase: open country drill-down panel
    console.log('[WorldMap] country clicked:', iso3, countByISO3[iso3] ?? 0, 'suppliers')
  }, [countByISO3])

  // ── Geography fill function ───────────────────────────────────────────────

  const getFill = useCallback((geo) => {
    const numericId = geo.id ?? geo.properties?.id
    const iso3      = NUMERIC_TO_ISO3[String(numericId).padStart(3, '0')]
    if (!iso3) return EMPTY_FILL
    const count = countByISO3[iso3]
    return count ? colorScale(count) : EMPTY_FILL
  }, [countByISO3, colorScale])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
      {/* Card header */}
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-base font-semibold text-slate-900">Geographic Distribution</h2>
        {maxCount > 0 && (
          <span className="text-xs text-slate-400">
            {Object.keys(countByISO3).length} countr{Object.keys(countByISO3).length !== 1 ? 'ies' : 'y'}
          </span>
        )}
      </div>

      {/* Legend */}
      {maxCount > 0 && <MapLegend maxCount={maxCount} />}

      {/* Map */}
      <div className="mt-4 relative w-full" style={{ fontSize: 0 }}>
        {!geoReady && <MapSkeleton />}

        <div style={{ visibility: geoReady ? 'visible' : 'hidden' }}>
          <ComposableMap
            projection="geoNaturalEarth1"
            projectionConfig={{ scale: 153 }}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies
              geography={GEO_URL}
              onError={(err) => console.error('[WorldMap] TopoJSON load error', err)}
            >
              {({ geographies, loading }) => {
                // Signal ready once geometries arrive
                if (!loading && !geoReady && geographies.length > 0) {
                  // Use rAF to avoid setState-during-render
                  requestAnimationFrame(() => setGeoReady(true))
                }

                return geographies.map((geo) => {
                  const numericId = geo.id ?? geo.properties?.id
                  const iso3      = NUMERIC_TO_ISO3[String(numericId).padStart(3, '0')]
                  const count     = iso3 ? (countByISO3[iso3] ?? 0) : 0
                  const hasData   = count > 0

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getFill(geo)}
                      stroke="none"
                      strokeWidth={0}
                      style={{
                        default: {
                          fill:    getFill(geo),
                          outline: 'none',
                          cursor:  hasData ? 'pointer' : 'default',
                        },
                        hover: {
                          fill:        hasData ? colorScale(count) : '#CBD5E1',
                          outline:     'none',
                          stroke:      hasData ? HOVER_STROKE : 'none',
                          strokeWidth: hasData ? 0.8 : 0,
                          cursor:      hasData ? 'pointer' : 'default',
                          filter:      hasData ? 'brightness(0.88)' : 'none',
                        },
                        pressed: {
                          fill:    hasData ? colorScale(count) : EMPTY_FILL,
                          outline: 'none',
                        },
                      }}
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseMove={(evt)  => handleMouseMove(geo, evt)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(geo)}
                      aria-label={
                        iso3 && hasData
                          ? `${ISO3_TO_NAME[iso3] ?? iso3}: ${count} supplier${count !== 1 ? 's' : ''}`
                          : undefined
                      }
                    />
                  )
                })
              }}
            </Geographies>
          </ComposableMap>
        </div>
      </div>

      {/* Empty state */}
      {geoReady && totalSuppliers === 0 && (
        <p className="text-center text-sm text-slate-400 mt-4">
          No supplier data loaded. Upload a CSV or try the sample dataset.
        </p>
      )}

      {/* Tooltip (portal-style fixed positioning) */}
      {tooltip && (
        <Tooltip
          data={tooltip.data}
          position={tooltip.position}
          total={totalSuppliers}
        />
      )}
    </div>
  )
}
