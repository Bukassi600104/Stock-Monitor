# NGX Dividend Radar

Local-first investment intelligence dashboard for Nigerian Exchange equities, dividend research, watchlist tracking, and manual portfolio monitoring through Stanbic IBTC Stockbrokers.

## What This V1 Includes

- Dark premium dashboard inspired by `sleek_ngx_dividend_radar_dashboard.png`
- Sidebar and top command bar with search, refresh state, `Ctrl + K` command center, and Ask AI entry
- Market pulse, data freshness, top opportunity, risk alerts, sector heatmap, dividend leaders, score distribution, watchlist movement, portfolio allocation, and AI briefing panels
- Market scanner, sector map, screener, dividend radar, stock detail, watchlist, alerts, assistant, reports, imports, and settings pages
- First-class Portfolio / Wallet module with overview, holdings, transactions, dividends, performance, risk/allocation, documents, and Stanbic IBTC broker setup
- Local seeded data and scoring helpers
- CSV import validator for stocks, prices, dividends, and Stanbic IBTC portfolio records with data-quality warnings
- Prisma/SQLite schema for future persistent local data
- API route stubs for refresh, stocks, sectors, scores, assistant, import, and reports

## Local Setup

```powershell
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

SQLite is intended for V1 local storage:

```powershell
npx prisma generate
npx prisma db push
npm run seed
```

The current UI reads seeded TypeScript data so the dashboard can run even before the SQLite workflow is connected.

## Privacy And Broker Guardrails

- This app does not place trades.
- Tony executes manually through Stanbic IBTC Stockbrokers.
- Do not store broker login or bank credentials.
- Keep `.env.local` out of Git.
- Documents should live under `data/documents/`; only paths and metadata should be stored.
- AI explanations must use available data, disclose missing/stale data, and avoid direct buy/sell instructions.

## Target Repo

This project is intended to be pushed to `Bukassi600104/Stock-Monitor`.
