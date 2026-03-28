# Workspace

## Overview

AI Portfolio Analyzer – India Markets. A full-stack production-ready fintech web app that allows users to analyze their Indian stock portfolio using dual AI (ChatGPT + Claude).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **AI**: OpenAI GPT (via Replit AI Integrations) + Anthropic Claude (via Replit AI Integrations)
- **PDF Export**: jsPDF + html2canvas
- **Animations**: Framer Motion

## Features

1. Select stocks from NIFTY 50 or SENSEX 30 (or build custom portfolio)
2. Real-time stock data fetching via Yahoo Finance API
3. Portfolio metrics: total value, gain/loss, sector allocation, P/E vs NIFTY, beta/risk
4. Dual AI analysis: ChatGPT + Claude side-by-side with Buy/Hold/Sell recommendations
5. Consensus AI View combining both models
6. Sector allocation pie chart
7. Holdings table with gain/loss colors
8. Export to PDF

## Structure

```text
artifacts-monorepo/
├── artifacts/              # Deployable applications
│   ├── api-server/         # Express API server
│   └── portfolio-analyzer/ # React Vite frontend
├── lib/                    # Shared libraries
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/ # OpenAI client via Replit AI Integrations
│   └── integrations-anthropic-ai/    # Anthropic client via Replit AI Integrations
├── scripts/                # Utility scripts
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Routes

- `GET /api/stocks/nifty50` - NIFTY 50 stock list
- `GET /api/stocks/sensex30` - SENSEX 30 stock list
- `POST /api/stocks/quote` - Real-time stock quotes from Yahoo Finance
- `POST /api/portfolio/analyze` - Portfolio metrics calculation
- `POST /api/ai/analyze` - Dual AI analysis (GPT + Claude)

## AI Integration

Uses Replit AI Integrations (no user API key needed):
- OpenAI: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`
- Anthropic: `AI_INTEGRATIONS_ANTHROPIC_BASE_URL`, `AI_INTEGRATIONS_ANTHROPIC_API_KEY`

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all packages as project references.

- **Always typecheck from the root** — run `pnpm run typecheck`
- **`emitDeclarationOnly`** — we only emit `.d.ts` files during typecheck
- **Project references** — when package A depends on package B, A's `tsconfig.json` must list B in its `references` array

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references

## Packages

### `artifacts/api-server` (`@workspace/api-server`)

Express 5 API server with routes for stocks, portfolio analysis, and AI insights.

### `artifacts/portfolio-analyzer` (`@workspace/portfolio-analyzer`)

React + Vite frontend dashboard. Deployed at `/` path.

### `lib/db` (`@workspace/db`)

Database layer using Drizzle ORM with PostgreSQL.

### `lib/api-spec` (`@workspace/api-spec`)

OpenAPI 3.1 spec and Orval codegen config.

Run codegen: `pnpm --filter @workspace/api-spec run codegen`

### `lib/api-zod` (`@workspace/api-zod`)

Generated Zod schemas from the OpenAPI spec.

### `lib/api-client-react` (`@workspace/api-client-react`)

Generated React Query hooks and fetch client from the OpenAPI spec.
