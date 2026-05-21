import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import FileUploader from '../components/upload/FileUploader'
import ColumnMapper from '../components/upload/ColumnMapper'
import { useSupplierData } from '../hooks/useSupplierData'

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Upload file', 'Map columns']

function StepIndicator({ current }) {
  return (
    <nav aria-label="Upload progress" className="flex items-center gap-1">
      {STEPS.map((label, i) => {
        const num    = i + 1
        const done   = num < current
        const active = num === current

        return (
          <div key={num} className="flex items-center gap-1">
            {/* Circle */}
            <div className="flex items-center gap-2">
              <div
                aria-current={active ? 'step' : undefined}
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  done   ? 'bg-emerald-500 text-white'
                  : active ? 'bg-blue-600 text-white'
                  :          'bg-slate-200 text-slate-500',
                ].join(' ')}
              >
                {done ? (
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-label="complete">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                ) : num}
              </div>
              <span className={[
                'text-sm font-medium hidden sm:block',
                active ? 'text-blue-700' : done ? 'text-emerald-600' : 'text-slate-400',
              ].join(' ')}>
                {label}
              </span>
            </div>

            {/* Connector */}
            {i < STEPS.length - 1 && (
              <div className={[
                'w-10 h-0.5 mx-1',
                done ? 'bg-emerald-400' : 'bg-slate-200',
              ].join(' ')} aria-hidden="true" />
            )}
          </div>
        )
      })}

      {/* Step counter (mobile) */}
      <span className="ml-2 text-xs text-slate-400 sm:hidden">
        Step {current} of {STEPS.length}
      </span>
    </nav>
  )
}

// ─── Back button ──────────────────────────────────────────────────────────────

function BackButton({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={[
        'inline-flex items-center gap-1.5 text-sm font-medium text-slate-500',
        'hover:text-slate-800 transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded',
      ].join(' ')}
    >
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" aria-hidden="true">
        <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
      </svg>
      {label}
    </button>
  )
}

// ─── UploadPage ───────────────────────────────────────────────────────────────

export default function UploadPage() {
  const navigate             = useNavigate()
  const { loadUploadedData } = useSupplierData()

  const [step,   setStep]   = useState(1)           // 1 | 2
  const [parsed, setParsed] = useState(null)        // { headers, rows, fileName }

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** FileUploader → parsed file ready → advance to step 2 */
  const handleFileParsed = (result) => {
    setParsed(result)
    setStep(2)
  }

  /** ColumnMapper → mapped supplier array ready → load + navigate */
  const handleSuppliersReady = (suppliers) => {
    loadUploadedData(suppliers, parsed?.fileName ?? '')
    navigate('/dashboard')
  }

  /** Back button: step 2 → step 1, or step 1 → home */
  const handleBack = () => {
    if (step === 2) {
      setParsed(null)
      setStep(1)
    } else {
      navigate('/')
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[calc(100vh-64px)] bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* Page chrome: back + step indicator */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <BackButton
            onClick={handleBack}
            label={step === 2 ? 'Back to upload' : 'Back to home'}
          />
          <StepIndicator current={step} />
        </div>

        {/* Step headline */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {step === 1 ? 'Upload your supplier list' : 'Map your columns'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {step === 1
              ? 'CSV or Excel file — max 1 MB. We never store your data.'
              : 'Tell us which columns contain supplier name and country.'}
          </p>
        </div>

        {/* Step content */}
        {step === 1 && (
          <FileUploader onFileParsed={handleFileParsed} />
        )}

        {step === 2 && parsed && (
          <ColumnMapper
            headers={parsed.headers}
            rows={parsed.rows}
            fileName={parsed.fileName}
            onSuppliersReady={handleSuppliersReady}
          />
        )}

        {/* Footer note */}
        <p className="text-xs text-slate-400 text-center">
          Prefer sample data?{' '}
          <Link
            to="/dashboard"
            className="text-blue-600 hover:text-blue-700 underline underline-offset-2 font-medium"
          >
            Skip upload and explore the demo →
          </Link>
        </p>

      </div>
    </div>
  )
}
