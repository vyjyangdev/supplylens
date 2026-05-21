import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { normalizeCountry, getCountryName } from '../../utils/countryNormalizer'
import countryMetadata from '../../data/country-metadata.json'

// ─── Field definitions ────────────────────────────────────────────────────────

const FIELDS = [
  {
    key:      'supplierName',
    label:    'Supplier Name',
    required: true,
    keywords: ['name', 'vendor', 'supplier', 'company'],
    hint:     'The company or entity name',
  },
  {
    key:      'country',
    label:    'Country',
    required: true,
    keywords: ['country', 'nation', 'origin', 'location', 'region'],
    hint:     'Country of manufacture or registration',
  },
  {
    key:      'city',
    label:    'City',
    required: false,
    keywords: ['city', 'town', 'municipality', 'site'],
    hint:     'City or facility location',
  },
  {
    key:      'commodity',
    label:    'Commodity / Category',
    required: false,
    keywords: ['commodity', 'category', 'product', 'part', 'component', 'material', 'type'],
    hint:     'What this supplier provides',
  },
  {
    key:      'annualSpend',
    label:    'Annual Spend',
    required: false,
    keywords: ['spend', 'cost', 'value', 'amount', 'budget', 'price', 'annual'],
    hint:     'Total spend per year (USD)',
  },
]

const PREVIEW_ROWS = 3

// ─── Pure helpers ─────────────────────────────────────────────────────────────

function detectBestMatch(headers, keywords, usedSet) {
  for (const keyword of keywords) {
    const hit = headers.find(
      h => !usedSet.has(h) && h.toLowerCase().includes(keyword),
    )
    if (hit) return hit
  }
  return null
}

function buildInitialMappings(headers) {
  const used     = new Set()
  const mappings = {}
  for (const field of FIELDS) {
    const match = detectBestMatch(headers, field.keywords, used)
    mappings[field.key] = match ?? null
    if (match) used.add(match)
  }
  return mappings
}

function parseSpend(raw) {
  if (raw == null || raw === '') return null
  // Strip currency symbols, spaces, commas
  const cleaned = String(raw).replace(/[$€£¥,\s]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? Math.round(n) : null
}

function cellValue(row, header) {
  if (!header) return ''
  const v = row[header]
  return v == null ? '' : String(v).trim()
}

function buildSupplierFromRow(row, mappings, index) {
  return {
    id:           `user-${index}`,
    name:         cellValue(row, mappings.supplierName),
    country:      cellValue(row, mappings.country),
    city:         mappings.city        ? cellValue(row, mappings.city)        : null,
    commodity:    mappings.commodity   ? cellValue(row, mappings.commodity)   : null,
    annualSpend:  mappings.annualSpend ? parseSpend(cellValue(row, mappings.annualSpend)) : null,
    criticality:  'standard',
  }
}

function getCountrySuggestions(input) {
  if (!input || input.length < 1) return []
  const lower = input.toLowerCase()
  return countryMetadata
    .filter(
      c =>
        c.name.toLowerCase().includes(lower) ||
        (c.nameVariants ?? []).some(v => String(v).toLowerCase().includes(lower)),
    )
    .slice(0, 6)
    .map(c => c.name)
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CheckIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  )
}

function WarnIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
    </svg>
  )
}

function ChevronIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className={className} aria-hidden="true">
      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
    </svg>
  )
}

// ─── FieldRow ─────────────────────────────────────────────────────────────────

function FieldRow({ field, headers, value, onChange, showError }) {
  const isAutoMatched = value !== null
  const id = `field-${field.key}`

  return (
    <div className="grid grid-cols-[200px_1fr_28px] items-center gap-3 py-2.5 border-b border-slate-100 last:border-0">
      {/* Label */}
      <label htmlFor={id} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {field.label}
        {field.required && (
          <span className="text-red-500 font-bold" aria-label="required">*</span>
        )}
        {!field.required && (
          <span className="text-xs font-normal text-slate-400">(optional)</span>
        )}
      </label>

      {/* Select */}
      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={e => onChange(field.key, e.target.value || null)}
          aria-label={`Map column to ${field.label}`}
          className={[
            'w-full appearance-none rounded-lg border px-3 py-2 pr-8 text-sm',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
            'transition-colors',
            showError && field.required && !value
              ? 'border-red-400 bg-red-50 text-red-700'
              : value
                ? 'border-blue-300 bg-blue-50 text-slate-800'
                : 'border-slate-300 bg-white text-slate-500',
          ].join(' ')}
        >
          <option value="">— Select a column…</option>
          {headers.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <ChevronIcon className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
      </div>

      {/* Status indicator */}
      <div className="flex justify-center">
        {value ? (
          <CheckIcon className="w-5 h-5 text-emerald-500" />
        ) : field.required && showError ? (
          <WarnIcon className="w-5 h-5 text-red-500" />
        ) : (
          <span className="w-5 h-5 rounded-full border-2 border-dashed border-slate-200" />
        )}
      </div>
    </div>
  )
}

// ─── PreviewTable ─────────────────────────────────────────────────────────────

function PreviewTable({ rows, mappings }) {
  const activeMappings = FIELDS.filter(f => mappings[f.key])
  if (!activeMappings.length) return null

  const previewRows = rows.slice(0, PREVIEW_ROWS)

  return (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
        Preview — first {previewRows.length} rows
      </p>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {activeMappings.map(f => (
                <th
                  key={f.key}
                  className="px-3 py-2 text-left text-xs font-semibold text-slate-600 whitespace-nowrap"
                >
                  <span className="text-slate-400 font-normal mr-1">{f.label}:</span>
                  <span className="text-slate-700">{mappings[f.key]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {previewRows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                {activeMappings.map(f => (
                  <td key={f.key} className="px-3 py-2 text-slate-700 max-w-[200px] truncate">
                    {cellValue(row, mappings[f.key]) || (
                      <span className="text-slate-300 italic">empty</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── CountryEditor ────────────────────────────────────────────────────────────

function CountryEditor({ supplierId, originalCountry, supplierName, onUpdate }) {
  const [inputValue, setInputValue]     = useState(originalCountry)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isConfirmed, setIsConfirmed]   = useState(false)
  const containerRef = useRef(null)

  const suggestions = useMemo(() => getCountrySuggestions(inputValue), [inputValue])
  const isValid = useMemo(() => !!normalizeCountry(inputValue), [inputValue])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = useCallback((name) => {
    setInputValue(name)
    setShowDropdown(false)
    setIsConfirmed(true)
    onUpdate(supplierId, name)
  }, [supplierId, onUpdate])

  const handleInputChange = (e) => {
    setInputValue(e.target.value)
    setIsConfirmed(false)
    setShowDropdown(true)
    onUpdate(supplierId, e.target.value) // optimistic update
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setShowDropdown(false)
    if (e.key === 'Enter' && suggestions.length > 0) {
      e.preventDefault()
      handleSelect(suggestions[0])
    }
  }

  return (
    <tr className="border-b border-slate-100">
      {/* Supplier name */}
      <td className="px-4 py-3 text-sm text-slate-700 font-medium whitespace-nowrap max-w-[180px] truncate">
        {supplierName}
      </td>

      {/* Original value */}
      <td className="px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
          <WarnIcon className="w-3 h-3" />
          {originalCountry || <span className="italic text-amber-500">empty</span>}
        </span>
      </td>

      {/* Editable correction */}
      <td className="px-4 py-3">
        <div ref={containerRef} className="relative max-w-[220px]">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setShowDropdown(suggestions.length > 0)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search countries…"
            aria-label={`Correct country for ${supplierName}`}
            className={[
              'w-full rounded-lg border px-3 py-1.5 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
              isConfirmed && isValid
                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                : isValid
                  ? 'border-blue-300 bg-blue-50 text-slate-800'
                  : 'border-slate-300 bg-white text-slate-700',
            ].join(' ')}
          />

          {/* Suggestion dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <ul
              role="listbox"
              aria-label="Country suggestions"
              className="absolute z-20 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg overflow-hidden"
            >
              {suggestions.map(name => (
                <li
                  key={name}
                  role="option"
                  aria-selected={inputValue === name}
                  className="px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(name) }}
                >
                  {name}
                  {inputValue === name && <CheckIcon className="w-4 h-4 text-emerald-500 shrink-0" />}
                </li>
              ))}
            </ul>
          )}
        </div>
      </td>

      {/* Status */}
      <td className="px-4 py-3 text-center">
        {isConfirmed && isValid ? (
          <CheckIcon className="w-5 h-5 text-emerald-500 mx-auto" />
        ) : (
          <span className="w-5 h-5 block mx-auto rounded-full border-2 border-dashed border-amber-300" />
        )}
      </td>
    </tr>
  )
}

// ─── UnresolvedReview ─────────────────────────────────────────────────────────

function UnresolvedReview({ unresolvedSuppliers, resolvedCount, onContinue }) {
  // supplierId → corrected country name (string)
  const [corrections, setCorrections] = useState({})

  const handleUpdate = useCallback((supplierId, value) => {
    setCorrections(prev => ({ ...prev, [supplierId]: value }))
  }, [])

  const fixedCount = useMemo(() => {
    return unresolvedSuppliers.filter(s => {
      const corrected = corrections[s.id]
      return corrected && normalizeCountry(corrected)
    }).length
  }, [corrections, unresolvedSuppliers])

  const handleContinue = () => {
    const fixed = unresolvedSuppliers.map(s => {
      const correction = corrections[s.id]
      if (correction) {
        const iso3 = normalizeCountry(correction)
        if (iso3) return { ...s, country: getCountryName(iso3) }
      }
      // Keep original (will be treated as unknown country in risk calc)
      return { ...s, _countryUnresolved: true }
    })
    onContinue(fixed)
  }

  const totalValid = resolvedCount + fixedCount
  const remaining  = unresolvedSuppliers.length - fixedCount

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
        <WarnIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-800">
            {unresolvedSuppliers.length} supplier{unresolvedSuppliers.length !== 1 ? 's' : ''}{' '}
            could not be located on the map
          </p>
          <p className="text-xs text-amber-700">
            Their country values didn't match any known country. Type to search and select
            the correct name, or continue — unresolved rows will use a default risk score.
          </p>
        </div>
      </div>

      {/* Correction table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600">Supplier</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600">Original value</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600">Corrected country</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-slate-600">Fixed</th>
            </tr>
          </thead>
          <tbody>
            {unresolvedSuppliers.map(s => (
              <CountryEditor
                key={s.id}
                supplierId={s.id}
                supplierName={s.name}
                originalCountry={s.country}
                onUpdate={handleUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Progress + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <p className="text-sm text-slate-500">
          {fixedCount > 0 ? (
            <span className="text-emerald-600 font-medium">{fixedCount} fixed</span>
          ) : null}
          {fixedCount > 0 && remaining > 0 ? ', ' : null}
          {remaining > 0 ? (
            <span className="text-amber-600">{remaining} still unresolved</span>
          ) : null}
          {fixedCount === 0 && remaining === 0 ? 'All fixed!' : null}
        </p>

        <button
          type="button"
          onClick={handleContinue}
          className={[
            'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
            'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
            'transition-colors shadow-sm',
          ].join(' ')}
        >
          Continue with {totalValid} supplier{totalValid !== 1 ? 's' : ''} →
        </button>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {{
 *   headers:          string[],
 *   rows:             object[],
 *   fileName:         string,
 *   onSuppliersReady: (suppliers: object[]) => void,
 * }} props
 */
export default function ColumnMapper({ headers, rows, fileName, onSuppliersReady }) {
  const [mappings, setMappings]           = useState(() => buildInitialMappings(headers))
  const [showErrors, setShowErrors]       = useState(false)
  const [step, setStep]                   = useState('mapping') // 'mapping' | 'review'
  const [resolvedSuppliers, setResolved]  = useState([])
  const [unresolvedSuppliers, setUnresolved] = useState([])

  const handleMappingChange = useCallback((key, value) => {
    setMappings(prev => ({ ...prev, [key]: value }))
    setShowErrors(false)
  }, [])

  const mappedCount = FIELDS.filter(f => mappings[f.key]).length
  const requiredMapped = !!mappings.supplierName && !!mappings.country

  // ── Analyze click ──────────────────────────────────────────────────────────

  const handleAnalyze = () => {
    if (!requiredMapped) {
      setShowErrors(true)
      return
    }

    // Build full supplier list (skip rows with empty supplier name)
    const allSuppliers = rows
      .filter(row => cellValue(row, mappings.supplierName) !== '')
      .map((row, i) => buildSupplierFromRow(row, mappings, i))

    const resolved   = []
    const unresolved = []

    for (const supplier of allSuppliers) {
      const iso3 = normalizeCountry(supplier.country)
      if (iso3) {
        resolved.push({ ...supplier, country: getCountryName(iso3) })
      } else {
        unresolved.push(supplier)
      }
    }

    if (unresolved.length === 0) {
      onSuppliersReady(resolved)
    } else {
      setResolved(resolved)
      setUnresolved(unresolved)
      setStep('review')
    }
  }

  // ── Review step complete ───────────────────────────────────────────────────

  const handleReviewContinue = useCallback((fixedUnresolved) => {
    onSuppliersReady([...resolvedSuppliers, ...fixedUnresolved])
  }, [resolvedSuppliers, onSuppliersReady])

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">

      {/* File context header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold text-slate-800">
            We detected{' '}
            <span className="text-blue-600">{rows.length.toLocaleString()} rows</span>
            {' '}in{' '}
            <span className="font-mono text-sm text-slate-600">{fileName}</span>
          </h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Map your columns to SupplyLens fields — required fields are marked with{' '}
            <span className="text-red-500 font-bold">*</span>
          </p>
        </div>

        {/* Mapping progress pill */}
        <span className={[
          'shrink-0 text-xs font-semibold px-3 py-1 rounded-full',
          mappedCount === FIELDS.length
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-slate-100 text-slate-500',
        ].join(' ')}>
          {mappedCount}/{FIELDS.length} columns mapped
        </span>
      </div>

      {step === 'mapping' ? (
        <>
          {/* ── Mapping UI ──────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
            {/* Column headers */}
            <div className="grid grid-cols-[200px_1fr_28px] gap-3 px-4 py-2 bg-slate-50">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">SupplyLens field</span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your column</span>
              <span />
            </div>

            <div className="px-4">
              {FIELDS.map(field => (
                <FieldRow
                  key={field.key}
                  field={field}
                  headers={headers}
                  value={mappings[field.key]}
                  onChange={handleMappingChange}
                  showError={showErrors}
                />
              ))}
            </div>
          </div>

          {/* Validation error banner */}
          {showErrors && !requiredMapped && (
            <div
              role="alert"
              className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
            >
              <WarnIcon className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">Supplier Name</span> and{' '}
                <span className="font-semibold">Country</span> are required before analysis.
              </p>
            </div>
          )}

          {/* Preview table */}
          <PreviewTable rows={rows} mappings={mappings} />

          {/* Analyze button */}
          <div className="flex items-center justify-between pt-2 flex-wrap gap-3">
            <p className="text-sm text-slate-400 italic">
              We need at minimum: supplier name + country
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={showErrors && !requiredMapped}
              aria-label="Analyze my supply chain"
              className={[
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold',
                'transition-colors shadow-sm',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
                requiredMapped
                  ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed',
              ].join(' ')}
            >
              Analyze My Supply Chain
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </>
      ) : (
        /* ── Review step ──────────────────────────────────────────────── */
        <UnresolvedReview
          unresolvedSuppliers={unresolvedSuppliers}
          resolvedCount={resolvedSuppliers.length}
          onContinue={handleReviewContinue}
        />
      )}
    </div>
  )
}
