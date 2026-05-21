import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SupplierDataProvider } from './hooks/useSupplierData'
import Header from './components/layout/Header'
import LandingPage from './pages/LandingPage'
import UploadPage from './pages/UploadPage'
import DashboardPage from './pages/DashboardPage'
import MethodologyPage from './pages/MethodologyPage'

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
            <Route path="/dashboard"   element={<DashboardPage />} />
            <Route path="/methodology" element={<MethodologyPage />} />
          </Routes>
        </div>
      </SupplierDataProvider>
    </BrowserRouter>
  )
}
