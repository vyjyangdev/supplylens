import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom'
import { SupplierDataProvider } from './hooks/useSupplierData'
import Header from './components/layout/Header'
import ErrorBoundary from './components/common/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import MethodologyPage from './pages/MethodologyPage'

/** Thin wrapper so the ErrorBoundary can call useNavigate for the reset CTA */
function DashboardWithBoundary() {
  const navigate = useNavigate()
  return (
    <ErrorBoundary onReset={() => navigate('/dashboard')}>
      <DashboardPage />
    </ErrorBoundary>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      {/*
        SupplierDataProvider wraps the entire route tree so every page
        (Landing, Upload, Dashboard, Methodology) can read/write supplier state.
      */}
      <SupplierDataProvider>
        <div className="min-h-screen bg-background">
          <Header />
          <Routes>
            <Route path="/"            element={<LandingPage />} />
            <Route path="/upload"      element={<UploadPage />} />
            <Route path="/dashboard"   element={<DashboardWithBoundary />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
        </div>
      </SupplierDataProvider>
    </BrowserRouter>
  )
}
