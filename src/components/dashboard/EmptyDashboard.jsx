/**
 * EmptyDashboard — CTA shown when no supplier data is loaded.
 *
 * Props:
 *   onLoadSample  () => void
 *   onUpload      () => void
 */
export default function EmptyDashboard({ onLoadSample, onUpload }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="max-w-md space-y-5">
        {/* Illustration placeholder */}
        <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden>
            <circle cx="20" cy="20" r="18" stroke="#BFDBFE" strokeWidth="2" />
            <path d="M12 20h16M20 12v16" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
            <circle cx="14" cy="20" r="2.5" fill="#60A5FA" />
            <circle cx="26" cy="20" r="2.5" fill="#60A5FA" />
            <circle cx="20" cy="14" r="2.5" fill="#60A5FA" />
            <circle cx="20" cy="26" r="2.5" fill="#60A5FA" />
          </svg>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900">
            No supplier data loaded
          </h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Upload your supplier list to see geographic concentration,
            country risk, and disruption exposure — or explore the demo
            with 50 sample suppliers.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
          <button
            type="button"
            onClick={onUpload}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Upload supplier list
          </button>
          <button
            type="button"
            onClick={onLoadSample}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Try with sample data
          </button>
        </div>
      </div>
    </div>
  )
}
