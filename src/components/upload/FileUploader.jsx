import { useState, useRef, useCallback } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const MAX_FILE_BYTES = 1 * 1024 * 1024  // 1 MB
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx']
const PREVIEW_ROW_COUNT = 5

const TEMPLATE_COLUMNS = ['Supplier Name', 'Country', 'City', 'Commodity', 'Annual Spend']
const TEMPLATE_ROWS = [
  ['Acme Electronics', 'China', 'Shenzhen', 'PCBs', '250000'],
  ['GlobalParts Ltd', 'Germany', 'Munich', 'Precision Sensors', '180000'],
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFileExtension(name) {
  return name.slice(name.lastIndexOf('.')).toLowerCase()
}

function validateFile(file) {
  const ext = getFileExtension(file.name)
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return `"${file.name}" is not supported. Please upload a .csv or .xlsx file.`
  }
  if (file.size > MAX_FILE_BYTES) {
    const sizeMB = (file.size / 1024 / 1024).toFixed(1)
    return `File is ${sizeMB} MB — the limit is 1 MB. Try splitting your supplier list into smaller batches.`
  }
  return null
}

function parseCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        if (!results.data?.length) {
          reject(new Error('The CSV file appears to be empty or has no data rows.'))
          return
        }
        const headers = results.meta.fields ?? []
        const rows    = results.data          // full dataset — ColumnMapper handles preview
        resolve({ headers, rows, fileName: file.name })
      },
      error(err) {
        reject(new Error(`CSV parse error: ${err.message}`))
      },
    })
  })
}

function parseXlsx(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data     = new Uint8Array(e.target.result)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheetName = workbook.SheetNames[0]
        if (!sheetName) throw new Error('The workbook contains no sheets.')
        const sheet = workbook.Sheets[sheetName]
        const json  = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
        if (json.length < 2) throw new Error('The spreadsheet appears to be empty or has no data rows.')
        const headers = json[0].map(String)
        const rows    = json.slice(1).map((row) =>    // full dataset
          Object.fromEntries(headers.map((h, i) => [h, String(row[i] ?? '')])),
        )
        resolve({ headers, rows, fileName: file.name })
      } catch (err) {
        reject(new Error(`Excel parse error: ${err.message}`))
      }
    }
    reader.onerror = () => reject(new Error('Could not read the file. Please try again.'))
    reader.readAsArrayBuffer(file)
  })
}

function downloadTemplate() {
  const csvContent = [
    TEMPLATE_COLUMNS.join(','),
    ...TEMPLATE_ROWS.map((r) => r.map((v) => `"${v}"`).join(',')),
  ].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href     = url
  link.download = 'supplier-template.csv'
  link.click()
  URL.revokeObjectURL(url)
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FileIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function UploadIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg
      className="animate-spin h-8 w-8 text-blue-600"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  )
}

function ErrorIcon({ className = '' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * @param {{ onFileParsed: (result: { headers: string[], rows: object[], fileName: string }) => void }} props
 */
export default function FileUploader({ onFileParsed }) {
  const [isDragOver, setIsDragOver]   = useState(false)
  const [isLoading, setIsLoading]     = useState(false)
  const [error, setError]             = useState(null)
  const [acceptedFile, setAcceptedFile] = useState(null)

  const inputRef = useRef(null)

  // ── File processing ──────────────────────────────────────────────────────

  const processFile = useCallback(async (file) => {
    setError(null)
    setAcceptedFile(null)

    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsLoading(true)
    setAcceptedFile(file.name)

    try {
      const ext    = getFileExtension(file.name)
      const result = ext === '.csv' ? await parseCsv(file) : await parseXlsx(file)
      onFileParsed?.(result)
    } catch (err) {
      setError(err.message)
      setAcceptedFile(null)
    } finally {
      setIsLoading(false)
    }
  }, [onFileParsed])

  // ── Drag handlers ────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    // Only clear if leaving the drop zone entirely, not a child element
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setIsDragOver(false)
    }
  }, [])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }, [processFile])

  // ── Input handler ────────────────────────────────────────────────────────

  const handleInputChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    // Reset input so re-selecting the same file still fires onChange
    e.target.value = ''
  }, [processFile])

  const openFilePicker = () => inputRef.current?.click()

  // ── Drop zone appearance ─────────────────────────────────────────────────

  const dropZoneBase = [
    'relative flex flex-col items-center justify-center gap-4',
    'min-h-[220px] w-full rounded-xl border-2 border-dashed',
    'transition-colors duration-150 cursor-pointer select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
  ].join(' ')

  const dropZoneColor = error
    ? 'border-red-300 bg-red-50'
    : isDragOver
      ? 'border-blue-500 bg-blue-50'
      : 'border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40'

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">

      {/* Hidden file input */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx"
        className="sr-only"
        onChange={handleInputChange}
        aria-label="Upload supplier file"
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop zone — drag and drop a CSV or Excel file, or press Enter to browse"
        className={`${dropZoneBase} ${dropZoneColor}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openFilePicker() } }}
      >
        {isLoading ? (
          /* Loading state */
          <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
            <Spinner />
            <p className="text-sm font-medium text-slate-600">
              Parsing <span className="text-blue-600">{acceptedFile}</span>…
            </p>
          </div>
        ) : error ? (
          /* Error state */
          <div
            className="flex flex-col items-center gap-3 px-6 text-center"
            role="alert"
            aria-live="assertive"
          >
            <ErrorIcon className="w-10 h-10 text-red-400" />
            <div>
              <p className="text-sm font-semibold text-red-700">Upload failed</p>
              <p className="mt-1 text-sm text-red-600 max-w-xs">{error}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setError(null); openFilePicker() }}
              className="mt-1 text-sm font-semibold text-blue-600 hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none"
            >
              Try a different file
            </button>
          </div>
        ) : acceptedFile ? (
          /* Success idle state */
          <div className="flex flex-col items-center gap-3">
            <FileIcon className="w-10 h-10 text-blue-500" />
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">{acceptedFile}</p>
              <p className="text-xs text-slate-500 mt-0.5">Parsed successfully — mapping columns below</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setAcceptedFile(null); openFilePicker() }}
              className="text-xs text-blue-600 hover:text-blue-700 underline underline-offset-2 focus-visible:outline-none"
            >
              Replace file
            </button>
          </div>
        ) : (
          /* Default idle state */
          <div className="flex flex-col items-center gap-4 px-6 text-center pointer-events-none">
            <div className={[
              'p-4 rounded-full transition-colors',
              isDragOver ? 'bg-blue-100' : 'bg-slate-100',
            ].join(' ')}>
              <UploadIcon className={[
                'w-8 h-8 transition-colors',
                isDragOver ? 'text-blue-600' : 'text-slate-400',
              ].join(' ')} />
            </div>

            <div className="space-y-1">
              <p className={[
                'text-base font-semibold transition-colors',
                isDragOver ? 'text-blue-700' : 'text-slate-700',
              ].join(' ')}>
                {isDragOver ? 'Drop to upload' : 'Drag & drop your supplier file'}
              </p>
              <p className="text-sm text-slate-500">
                or{' '}
                <span className="font-semibold text-blue-600 pointer-events-auto">
                  browse files
                </span>
                {' '}— CSV or Excel (.xlsx)
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono">.csv</span>
              <span className="px-2 py-0.5 bg-white border border-slate-200 rounded font-mono">.xlsx</span>
              <span>·</span>
              <span>Max 1 MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Helper text row */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <p className="text-sm text-slate-500">
          <span className="font-medium text-slate-700">Required columns:</span>{' '}
          supplier name + country.{' '}
          <span className="text-slate-400">City, commodity, and spend are optional.</span>
        </p>
        <button
          type="button"
          onClick={downloadTemplate}
          className={[
            'shrink-0 text-sm font-semibold text-blue-600',
            'hover:text-blue-700 underline underline-offset-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-1 rounded',
          ].join(' ')}
        >
          Download template CSV
        </button>
      </div>
    </div>
  )
}
