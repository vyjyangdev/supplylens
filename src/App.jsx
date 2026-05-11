import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Header from './components/layout/Header'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import MethodologyPage from './pages/MethodologyPage'

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Header />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/methodology" element={<MethodologyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
