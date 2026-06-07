# NGX Dividend Radar V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished local-first NGX Dividend Radar V1 from the handoff spec and dashboard reference.

**Architecture:** Use a Next.js App Router application with TypeScript, Tailwind CSS, Prisma/SQLite schema, seeded local data, reusable dashboard components, route-level feature pages, and mockable AI/report/refresh flows. The first build focuses on a complete usable local shell with rich seeded intelligence and extension points for live NGX/OpenAI integrations.

**Tech Stack:** Next.js, TypeScript, Tailwind CSS, Prisma, SQLite, Recharts, Framer Motion, TanStack Table, Zod, lucide-react.

---

### Task 1: Scaffold And Dependencies

**Files:**
- Create: Next.js project files in the repo root
- Modify: `package.json`

- [x] Create the Next.js TypeScript app in the existing empty repo.
- [x] Install dashboard, data, chart, animation, table, validation, and ORM dependencies.

### Task 2: Data And Scoring Layer

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `src/lib/data.ts`
- Create: `src/lib/scoring.ts`
- Create: `src/lib/types.ts`

- [ ] Define stocks, prices, dividends, scores, watchlist, portfolio holdings, transactions, documents, alerts, AI analyses, and broker setup models.
- [ ] Seed realistic sample NGX records, Stanbic IBTC broker defaults, portfolio holdings, alerts, watchlist entries, and dashboard snapshots.
- [ ] Implement scoring helpers that expose opportunity, dividend, valuation, liquidity, sector, and risk scores.

### Task 3: Visual System And App Shell

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/components/layout/AppShell.tsx`
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/TopBar.tsx`
- Create: `src/components/layout/CommandCenter.tsx`
- Create: `src/components/ui/*`

- [ ] Match the reference image's dark theme, spacing, card hierarchy, sidebar, top command bar, badges, controls, and chart container style.
- [ ] Implement command palette, theme toggle, refresh state, and search filtering.

### Task 4: Core Dashboard

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/components/dashboard/*`
- Create: `src/components/charts/*`

- [ ] Build market pulse, freshness, top opportunity, risk alerts, sector heatmap, dividend leaders, score distribution, changed items, watchlist movement, portfolio allocation, and AI briefing panels.
- [ ] Add local state interactions for refresh, watchlist, sector selection, and AI prompt demo.

### Task 5: Feature Routes

**Files:**
- Create: `src/app/market/page.tsx`
- Create: `src/app/sectors/page.tsx`
- Create: `src/app/stocks/[symbol]/page.tsx`
- Create: `src/app/screener/page.tsx`
- Create: `src/app/dividend-radar/page.tsx`
- Create: `src/app/watchlist/page.tsx`
- Create: `src/app/portfolio/page.tsx`
- Create: `src/app/portfolio/*/page.tsx`
- Create: `src/app/alerts/page.tsx`
- Create: `src/app/assistant/page.tsx`
- Create: `src/app/reports/page.tsx`
- Create: `src/app/imports/page.tsx`
- Create: `src/app/settings/page.tsx`

- [ ] Provide every navigation route requested in the handoff.
- [ ] Build market/scanner tables, dividend radar filters, stock detail intelligence, watchlist, full portfolio tabs, broker setup fields, document metadata, alerts, assistant, reports, imports, and settings.

### Task 6: API Routes And Local Workflows

**Files:**
- Create: `src/app/api/refresh/route.ts`
- Create: `src/app/api/stocks/route.ts`
- Create: `src/app/api/sectors/route.ts`
- Create: `src/app/api/score/route.ts`
- Create: `src/app/api/assistant/route.ts`
- Create: `src/app/api/import/route.ts`
- Create: `src/app/api/reports/route.ts`

- [ ] Return local seeded data and simulated refresh/import/report/AI responses.
- [ ] Keep AI guardrails clear: data-first, no trade execution, no public advisory language, stale-data disclosure.

### Task 7: Verification, Docs, And GitHub

**Files:**
- Create: `README.md`
- Create: `.env.example`

- [ ] Run lint/build checks.
- [ ] Run the app locally and compare against the reference image using browser screenshots and `view_image`.
- [ ] Confirm desktop/mobile layout, command palette, refresh action, filters, watchlist actions, portfolio tabs, report export, and assistant demo.
- [ ] Commit and push to `Bukassi600104/Stock-Monitor`.
