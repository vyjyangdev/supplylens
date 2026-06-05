/**
 * ErrorBoundary — catches render errors in the wrapped subtree and shows a
 * friendly fallback instead of a white screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <DashboardPage />
 *   </ErrorBoundary>
 *
 *   // Custom fallback:
 *   <ErrorBoundary fallback={<MyFallback />}>
 *     ...
 *   </ErrorBoundary>
 */
import { Component } from 'react'

function DefaultFallback({ onReset }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-16 text-center">
      <div className="max-w-md space-y-5">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center mx-auto">
          <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8" aria-hidden>
            <circle cx="20" cy="20" r="18" stroke="#FCA5A5" strokeWidth="2" />
            <path d="M20 12v10M20 27v2" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-bold text-slate-900">Something went wrong</h2>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            An unexpected error occurred. Try refreshing the page, or upload your
            data again.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
          >
            Refresh page
          </button>
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white text-slate-700 text-sm font-semibold border border-slate-300 hover:border-slate-400 hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
            >
              Go to dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
    this.handleReset = this.handleReset.bind(this)
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console in development; swap for Sentry / LogRocket in production
    console.error('[ErrorBoundary] Caught render error:', error, info.componentStack)
  }

  handleReset() {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback
      return (
        <DefaultFallback
          error={this.state.error}
          onReset={this.props.onReset ? this.handleReset : null}
        />
      )
    }
    return this.props.children
  }
}
