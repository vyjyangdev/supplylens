# SupplyLens — Supply Chain Risk Monitor

## What This Is
A client-side React web app that lets procurement managers upload a supplier CSV and instantly see supply chain risk: geographic concentration, country risk scores, disruption context, and a composite risk score with recommendations. No backend, no accounts, no API keys.

## Tech Stack
- React 18+ with Vite
- Tailwind CSS (utility-first, no custom CSS files)
- Recharts (bar charts, gauges)
- react-simple-maps + TopoJSON (world map with country-level shading)
- PapaParse (CSV parsing), SheetJS/xlsx (Excel parsing)
- react-to-print (PDF export)
- Deployed on Vercel

## Project Structure
```
src/
├── components/
│   ├── layout/          # Header, Footer, PageLayout
│   ├── landing/         # HeroSection, HowItWorks, SampleDataCTA
│   ├── upload/          # FileUploader, ColumnMapper, DataPreview
│   ├── dashboard/       # RiskScoreGauge, TopRisks, StatusBanner
│   ├── map/             # WorldMap, CountryTooltip, MapLegend
│   ├── charts/          # ConcentrationChart, RiskBreakdown
│   ├── disruptions/     # EventFeed, EventCard
│   └── common/          # RiskBadge, Card, Button, LoadingState
├── data/                # Static JSON (country risks, sample suppliers, events)
├── hooks/               # useRiskScore, useSupplierData, useCountryLookup
├── utils/               # riskCalculations.js, countryNormalizer.js, csvParser.js
├── pages/               # LandingPage, DashboardPage, MethodologyPage
└── constants/           # riskThresholds.js, colorTokens.js, weightConfig.js
```

## Data Files (in src/data/)
- `sample-suppliers.json` — 50 demo suppliers across 12 countries
- `country-risk-scores.json` — Pre-computed risk scores (political, hazard, trade) per country
- `country-metadata.json` — ISO codes, names, name variants for normalization, coordinates
- `events.json` — 30-40 curated recent supply chain disruptions
- `world-topo.json` — TopoJSON for map rendering

## Risk Score Formula
```
Overall (0-100) = 0.35 × Geographic + 0.30 × Country + 0.20 × Disruption + 0.15 × SingleSource

Geographic: HHI of supplier count by country, normalized to 0-100
Country: Weighted avg of country risk scores (0.4×Political + 0.35×Hazard + 0.25×Trade)
Disruption: Sum of matched event severities with time decay, capped at 100
SingleSource: Max across categories (1 supplier=100, 2=50, 3=20, 4+=5)
```

## Design System
- Font: Inter (Google Fonts), 400/600/700 weights
- Background: #F8FAFC, Surface: #FFFFFF, Text: #0F172A, Secondary: #64748B
- Brand: #2563EB (blue-600)
- Risk colors: LOW=#22C55E, MODERATE=#F59E0B, HIGH=#F97316, CRITICAL=#EF4444
- Card: `bg-white rounded-xl border border-slate-200 p-6 shadow-sm`
- Max width: 1280px centered. Dashboard: 2-col desktop, 1-col mobile.

## Key User Flows
1. Landing → "Try with Sample Data" → Dashboard (pre-loaded, one click)
2. Landing → "Upload CSV" → Column Mapper → Dashboard (with user data)
3. Dashboard → "Export PDF" → Print-optimized view → Browser print dialog

## Coding Rules
- Functional components + hooks only. No class components.
- All risk calculation logic in utils/riskCalculations.js — NOT in components.
- Country normalization in utils/countryNormalizer.js with a lookup table of name variants.
- Risk thresholds and weights in constants/ — never hardcoded in components.
- Use ResponsiveContainer wrapper for all Recharts components.
- Loading states for any async operation (file parsing, geocoding).
- No localStorage except for optional data persistence (feature, not default).
- No API keys. All data is static JSON shipped with the app.
- Accessibility: aria-labels on interactive elements, sufficient color contrast.

## Common Mistakes to Avoid
- Do NOT use localStorage or sessionStorage by default — use React state
- Do NOT skip loading states during CSV parsing (large files take time)
- Do NOT render the map before TopoJSON loads — show a skeleton
- Do NOT hardcode country names — always normalize through countryNormalizer
- Do NOT put risk calculation logic inside components — keep it in utils
- When using react-simple-maps, always set projection to geoMercator or geoNaturalEarth1
- When generating recommendation text, use template functions not string concatenation

## Git Conventions
- Branch per feature: `feat/landing-page`, `feat/upload-flow`, `feat/map-visualization`
- Commits: `feat: add CSV column mapper` / `fix: handle missing country field`
- Main branch = production-ready, deployed via Vercel
