import { NavLink } from 'react-router-dom'

export default function Header() {
  const navLinkClass = ({ isActive }) =>
    `text-sm font-semibold transition-colors ${
      isActive ? 'text-brand' : 'text-text-secondary hover:text-text-primary'
    }`

  return (
    <header className="bg-surface border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-content mx-auto px-6 h-16 flex items-center justify-between">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">SL</span>
          </div>
          <span className="text-lg font-bold text-text-primary tracking-tight">SupplyLens</span>
        </NavLink>

        <nav className="flex items-center gap-6" aria-label="Main navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/dashboard" className={navLinkClass}>
            Dashboard
          </NavLink>
          <NavLink to="/methodology" className={navLinkClass}>
            Methodology
          </NavLink>
          <NavLink
            to="/upload"
            className="ml-2 px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Upload CSV
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
