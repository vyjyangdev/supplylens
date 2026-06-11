# SupplyLens — Supply Chain Risk Monitor

**Instant, client-side supply chain risk analysis. Upload a supplier CSV and get a composite risk score, geographic concentration map, disruption alerts, and AI-powered recommendations — in seconds, with no backend.**

## 🔗 [Live Demo → supplylens-nine.vercel.app](https://supplylens-nine.vercel.app/)

---

## The Problem

Most mid-market procurement teams manage their supplier risk in spreadsheets. They know concentration is a problem — but they don't know *how bad* until something breaks. When a factory in Taiwan shuts down or a geopolitical shock hits Southeast Asia, they're scrambling through Excel to figure out who's affected. SupplyLens makes that picture visible in one click.

---

## Features

- **Composite Risk Score** — a single 0–100 score built from four weighted components: geographic concentration, country risk, active disruption events, and single-source exposure
- **Interactive World Map** — choropleth shading by supplier density; hover tooltips with country risk details
- **Geographic Concentration Chart** — horizontal bar chart with HHI score and 30% threshold warning
- **Disruption Event Feed** — 35+ curated supply chain events matched against your supplier countries; severity-coded with time decay
- **Top Risks Ranked** — prioritized list of your highest-severity exposures with plain-English recommendations
- **AI Risk Advisor** — Claude-powered chat panel that answers questions about *your specific data* ("What happens if I lose my China suppliers?")
- **PDF Export** — single-page A4 risk summary with all key metrics, ready to share with leadership
- **No backend** — all computation is client-side; your supplier data never leaves your browser

---

## How It Works

1. **Upload** — drag and drop a CSV or Excel file with supplier name and country (city, commodity, and spend are optional). SupplyLens auto-maps your columns.
2. **Analyze** — a composite risk score is computed instantly: geographic HHI, country risk scores (political + hazard + trade), matched disruption events, and single-source category exposure.
3. **Act** — review ranked risk findings with concrete recommendations, then export a PDF summary or ask the AI advisor for tailored next steps.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | Tailwind CSS v3 |
| Charts | Recharts v3 |
| Map | react-simple-maps + TopoJSON (world-atlas) |
| File parsing | PapaParse (CSV), SheetJS/xlsx (Excel) |
| PDF export | react-to-print |
| AI advisor | Anthropic Claude (via Vercel serverless proxy) |
| Deployment | Vercel |

---

## Risk Scoring Methodology

```
Overall Score (0–100) =
  0.35 × Geographic Concentration
  0.30 × Country Risk
  0.20 × Disruption Exposure
  0.15 × Single-Source Risk
```

| Component | How it's calculated |
|---|---|
| **Geographic** | Herfindahl-Hirschman Index (HHI) of supplier count by country, normalized via `√HHI × 100` |
| **Country Risk** | Weighted average of per-country scores: `0.4 × Political + 0.35 × Natural Hazard + 0.25 × Trade` |
| **Disruption** | Sum of matched event severities (Critical=40, High=25, Medium=15, Low=5) with time decay: 1× ≤90 days, 0.5× 91–180 days, 0.25× >180 days; capped at 100 |
| **Single-Source** | Max across commodity categories: 1 supplier=100, 2=50, 3=20, 4+=5 |

Risk levels: **LOW** (<30) · **MODERATE** (30–54) · **HIGH** (55–74) · **CRITICAL** (≥75)

---

## Data Sources

| Dataset | Source | Notes |
|---|---|---|
| Country risk scores | World Bank Governance Indicators, EM-DAT, WTO | Pre-computed composite scores for 53 countries |
| Disruption events | Curated from Reuters, Supply Chain Dive, CISA | 35 events; updated manually |
| World map geometry | [world-atlas](https://github.com/topojson/world-atlas) | 110m resolution TopoJSON, bundled locally |
| Country metadata | ISO 3166-1 + custom name variants | Used for normalizing free-text country names |

---

## Product Thinking

### Why mid-market?

Enterprise teams have Resilinc, Riskmethods, and SAP Ariba. SMBs don't have a procurement function. Mid-market (100–2,000 employees) teams are large enough to have meaningful supplier complexity but too small to afford dedicated risk platforms. They're the gap.

### Why client-side?

Supplier data is sensitive. A VP of Supply Chain will not upload their vendor list to a tool that stores it server-side without a DPA, security review, and legal sign-off. Making everything client-side removes that friction entirely. The trade-off is no persistence — but for a first look at your risk profile, that's fine.

### What's deliberately NOT in V1

- No supplier financial health scores (requires paid data feeds)
- No real-time event ingestion (would require a backend + scraping infrastructure)
- No multi-user collaboration or saved sessions (scope creep)
- No tier-2 / tier-3 supplier mapping (requires network-of-networks data)

---

## Future Roadmap (V2)

- [ ] **Saved sessions** — optional browser storage to persist analysis between visits
- [ ] **Scenario simulation** — "what if I lose my top 3 China suppliers?" instant recalculation
- [ ] **Supplier financial health** — integrate D&B or Cortera scores via API
- [ ] **Real-time disruption feed** — webhook-driven event ingestion from NewsAPI / GDELT
- [ ] **Tier-2 mapping** — link known commodity → country → tier-2 exposure
- [ ] **CSV export** — download enriched supplier list with risk scores appended
- [ ] **Team sharing** — shareable read-only dashboard links (no server needed: encode state in URL)
- [ ] **Benchmark mode** — compare your concentration profile against industry medians

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5174)
npm run dev

# Build for production
npm run build
```

### AI Advisor setup (optional)

The Risk Advisor chat feature requires an Anthropic API key. Without it, the dashboard still works fully — only the chat panel will show an error.

```bash
# Create .env.local (gitignored)
echo "ANTHROPIC_API_KEY=sk-ant-..." >> .env.local

# Restart dev server
npm run dev
```

On Vercel, add `ANTHROPIC_API_KEY` as a project environment variable in the dashboard.

---

## Author

Built by **Yujie Yang**

- Portfolio: [yujieyang.com](https://yujieyang.com)
- GitHub: [github.com/vyjyangdev](https://github.com/vyjyangdev)
- LinkedIn: [linkedin.com/in/yujieyang](https://linkedin.com/in/yujieyang)

---

*Data is for procurement planning use only. Country risk scores are pre-computed from public sources and may not reflect current conditions. Not financial advice.*
