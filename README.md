# AI Portfolio Analyzer – India Markets

A production-ready, full-stack fintech web application for analyzing Indian stock portfolios using dual AI from **ChatGPT** and **Claude** — side-by-side.

---

## Features

- **NIFTY 50 / SENSEX 30 stock picker** with real-time live prices via Yahoo Finance
- **Custom portfolio** entry for any NSE-listed stock
- **Portfolio metrics** — total value, P&L, weighted P/E, sector allocation, concentration risk
- **Sector allocation pie chart** with accurate static sector data for all NIFTY/SENSEX constituents
- **Holdings breakdown table** — weight, avg price, LTP, P&L per stock
- **Historical Trends** — 6-month / 1-year line charts with three views:
  - Portfolio ₹ value over time
  - % change comparison (each stock vs portfolio)
  - Individual stock price trend
- **Dual AI analysis** — GPT and Claude analyze independently, then produce a Consensus View
- **Buy / Hold / Sell recommendations** per stock from each model
- **PDF export** of the full dashboard
- **No API key needed** — AI access via Replit AI Integrations proxy

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | pnpm workspaces |
| Language | TypeScript 5.9 |
| Backend | Node.js 24 + Express 5 |
| Frontend | React 19 + Vite + Tailwind CSS |
| UI components | shadcn/ui + Framer Motion |
| Charts | Recharts |
| API contract | OpenAPI 3.1 → Orval codegen |
| Validation | Zod |
| Data fetching | TanStack React Query |
| AI – GPT | OpenAI `gpt-5.2` via Replit AI Integrations |
| AI – Claude | Anthropic `claude-sonnet-4-6` via Replit AI Integrations |
| Stock data | Yahoo Finance v8 chart API |
| PDF export | jsPDF + html2canvas |

---

## Project Structure

```
.
├── artifacts/
│   ├── api-server/          # Express 5 REST API
│   │   └── src/routes/
│   │       ├── stocks.ts    # NIFTY/SENSEX lists + quotes
│   │       ├── history.ts   # Historical price data (6mo / 1y)
│   │       ├── portfolio.ts # Portfolio metrics calculation
│   │       └── ai.ts        # Dual AI analysis (GPT + Claude)
│   └── portfolio-analyzer/  # React + Vite frontend
│       └── src/
│           ├── pages/Home.tsx
│           └── components/
│               ├── PortfolioBuilder.tsx
│               ├── DashboardMetrics.tsx
│               ├── HistoricalTrends.tsx
│               └── AIInsightsPanel.tsx
├── lib/
│   ├── api-spec/            # OpenAPI 3.1 spec + Orval config
│   ├── api-zod/             # Generated Zod validation schemas
│   ├── api-client-react/    # Generated React Query hooks
│   ├── db/                  # Drizzle ORM + PostgreSQL
│   ├── integrations-openai-ai-server/
│   └── integrations-anthropic-ai/
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── package.json
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/stocks/nifty50` | Full NIFTY 50 stock list |
| `GET` | `/api/stocks/sensex30` | Full SENSEX 30 stock list |
| `POST` | `/api/stocks/quote` | Real-time quotes from Yahoo Finance |
| `POST` | `/api/stocks/history` | Historical price data (6mo / 1y) |
| `POST` | `/api/portfolio/analyze` | Portfolio value, sector, risk metrics |
| `POST` | `/api/ai/analyze` | Dual AI analysis — GPT + Claude |

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Environment Variables

The app uses Replit AI Integrations to access AI models — no OpenAI or Anthropic API key is needed when running on Replit.

For local development, create a `.env` in `artifacts/api-server/`:

```env
# Replit AI Integrations (set automatically on Replit)
AI_INTEGRATIONS_OPENAI_BASE_URL=https://...
AI_INTEGRATIONS_OPENAI_API_KEY=...
AI_INTEGRATIONS_ANTHROPIC_BASE_URL=https://...
AI_INTEGRATIONS_ANTHROPIC_KEY=...

SESSION_SECRET=your-local-session-secret
```

> **Note:** These values are injected automatically on Replit. For local dev you will need your own OpenAI / Anthropic API keys and point the base URLs to the official API endpoints.

### Run (two terminals)

**Terminal 1 — API server:**
```bash
pnpm --filter @workspace/api-server run dev
```

**Terminal 2 — Frontend:**
```bash
pnpm --filter @workspace/portfolio-analyzer run dev
```

### Regenerate API client (after changing `openapi.yaml`)

```bash
pnpm --filter @workspace/api-spec run codegen
```

---

## Deployment

This app is designed to deploy on **Replit** with one click. AI model access (GPT + Claude) is provided by Replit AI Integrations — no API keys required.

---

## Created by

**Abhilash Mondal**
