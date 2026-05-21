import { useNavigate } from 'react-router-dom'
import { useSupplierData } from '../hooks/useSupplierData'

export default function LandingPage() {
  const navigate          = useNavigate()
  const { loadSampleData } = useSupplierData()

  const handleTrySample = () => {
    loadSampleData()
    navigate('/dashboard')
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div className="max-w-xl space-y-6">
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
          Supply Chain Risk,<br />
          <span className="text-blue-600">at a glance.</span>
        </h1>
        <p className="text-lg text-slate-500">
          Upload your supplier list and instantly see geographic concentration,
          country risk, and live disruption exposure — no account required.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('/upload')}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Upload CSV →
          </button>
          <button
            type="button"
            onClick={handleTrySample}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Try with sample data
          </button>
        </div>

        <p className="text-xs text-slate-400">
          No sign-up · No data stored · Works entirely in your browser
        </p>
      </div>
    </main>
  )
}
