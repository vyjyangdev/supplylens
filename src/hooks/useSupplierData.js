import { createContext, useContext, useState, useCallback, useMemo, createElement } from 'react'
import sampleSuppliers from '../data/sample-suppliers.json'

// ─── Context ──────────────────────────────────────────────────────────────────

const SupplierDataContext = createContext(null)

// ─── Stats computation ────────────────────────────────────────────────────────

function computeStats(suppliers) {
  if (!suppliers.length) {
    return { totalSuppliers: 0, countries: 0, commodities: 0, totalSpend: 0 }
  }
  const countrySet   = new Set(suppliers.map(s => s.country).filter(Boolean))
  const commoditySet = new Set(suppliers.map(s => s.commodity).filter(Boolean))
  const totalSpend   = suppliers.reduce((sum, s) => sum + (s.annualSpend ?? 0), 0)
  return {
    totalSuppliers: suppliers.length,
    countries:      countrySet.size,
    commodities:    commoditySet.size,
    totalSpend,
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

/**
 * Wrap the app (or a subtree) with this provider to make supplier state
 * globally accessible via useSupplierData().
 */
export function SupplierDataProvider({ children }) {
  const [suppliers, setSuppliers] = useState([])
  const [source,    setSource]    = useState('none')   // 'none' | 'sample' | 'upload'
  const [fileName,  setFileName]  = useState('')

  // ── Actions ────────────────────────────────────────────────────────────────

  /** Load the bundled sample dataset (50 suppliers). */
  const loadSampleData = useCallback(() => {
    setSuppliers(sampleSuppliers)
    setSource('sample')
    setFileName('sample-suppliers.json')
  }, [])

  /**
   * Replace the current dataset with user-uploaded suppliers.
   * @param {object[]} data     Normalised supplier objects from ColumnMapper
   * @param {string}   [name]   Original file name for display purposes
   */
  const loadUploadedData = useCallback((data, name = '') => {
    setSuppliers(data)
    setSource('upload')
    setFileName(name)
  }, [])

  /** Reset everything back to the empty state. */
  const clearData = useCallback(() => {
    setSuppliers([])
    setSource('none')
    setFileName('')
  }, [])

  // ── Derived stats (memo — recomputed only when suppliers change) ────────────

  const stats = useMemo(() => computeStats(suppliers), [suppliers])

  /** Functional alias for callers that prefer method-call style. */
  const getStats = useCallback(() => stats, [stats])

  // ── Context value ──────────────────────────────────────────────────────────

  const value = {
    // State
    suppliers,
    source,
    fileName,
    stats,
    // Methods
    loadSampleData,
    loadUploadedData,
    clearData,
    getStats,
  }

  return createElement(SupplierDataContext.Provider, { value }, children)
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Consume the global supplier data context.
 * Must be called inside a <SupplierDataProvider>.
 */
export function useSupplierData() {
  const ctx = useContext(SupplierDataContext)
  if (!ctx) {
    throw new Error('useSupplierData must be called inside <SupplierDataProvider>')
  }
  return ctx
}
