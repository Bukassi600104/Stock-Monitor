"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, Bot, CheckCircle2, Download, FileText, Filter, Plus, Upload } from "lucide-react";
import { alerts, brokerSetup, documents, holdings, portfolio, sectors, stocks, transactions, watchlist } from "@/lib/data";
import type { AssistantAnswer } from "@/lib/assistant";
import { getHoldingDetail } from "@/lib/holdingDetail";
import { buildHoldingDraft, validateHoldingDraft, type HoldingDraftInput, type HoldingDraftTag } from "@/lib/holdingDraft";
import { importTemplates, type ImportKind, type ImportValidationResult } from "@/lib/imports";
import { generateReport, reportDefinitions, type GeneratedReport, type ReportType } from "@/lib/reports";
import { formatCompactNaira, formatNaira } from "@/lib/scoring";
import { buildTransactionDraft, validateTransactionDraft, type TransactionDraftInput, type TransactionDraftType } from "@/lib/transactionDraft";
import { Badge, Card, Metric, ScoreBadge, SectionTitle } from "@/components/ui/Primitives";
import { DonutChart, ScoreRing, Sparkline } from "@/components/dashboard/Charts";

function PageHeader({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h1 className="text-3xl font-black text-white">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}

function StockRows({ compact = false }: { compact?: boolean }) {
  return (
    <div className="overflow-x-auto thin-scrollbar">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="text-[11px] uppercase text-slate-500">
          <tr>
            <th className="py-3">Rank</th>
            <th>Symbol</th>
            <th>Sector</th>
            <th>Price</th>
            <th>Change</th>
            <th>Volume</th>
            <th>Yield</th>
            <th>P/E</th>
            <th>Opportunity</th>
            <th>Risk</th>
            <th>Label</th>
            {!compact && <th>Trend</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {stocks.map((stock, index) => (
            <tr key={stock.symbol} className="hover:bg-slate-900/60">
              <td className="py-4 text-slate-400">{index + 1}</td>
              <td>
                <a href={`/stocks/${stock.symbol}`} className="font-black text-white hover:text-blue-300">{stock.symbol}</a>
                <div className="text-xs text-slate-500">{stock.company}</div>
              </td>
              <td className="text-slate-300">{stock.sector}</td>
              <td className="font-semibold text-slate-100">{formatNaira(stock.price)}</td>
              <td className={stock.change >= 0 ? "font-bold text-emerald-400" : "font-bold text-red-400"}>{stock.change > 0 ? "+" : ""}{stock.change.toFixed(2)}%</td>
              <td className="text-slate-300">{stock.volume.toLocaleString()}</td>
              <td className="font-semibold text-slate-100">{stock.dividendYield.toFixed(2)}%</td>
              <td className="text-slate-300">{stock.pe || "n/a"}</td>
              <td><ScoreBadge score={stock.opportunityScore} /></td>
              <td><Badge tone={stock.riskLevel === "Low" ? "positive" : stock.riskLevel === "High" ? "danger" : "warning"}>{stock.riskLevel}</Badge></td>
              <td className="max-w-[190px] text-xs text-slate-300">{stock.label}</td>
              {!compact && <td className="w-28"><Sparkline values={stock.trend} className="h-8" stroke={stock.change >= 0 ? "#22C55E" : "#EF4444"} /></td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MarketPage() {
  const [risk, setRisk] = useState("All");
  const visible = useMemo(() => (risk === "All" ? stocks : stocks.filter((stock) => stock.riskLevel === risk)), [risk]);
  const selected = visible[0] ?? stocks[0];

  return (
    <>
      <PageHeader
        title="Market Scanner"
        description="Rank all scanned NGX equities by dividend quality, valuation, liquidity, sector context, and risk. Expand from here into stock detail pages before researching a manual trade."
        action={<select value={risk} onChange={(event) => setRisk(event.target.value)} className="h-10 rounded-[8px] border border-slate-700 bg-slate-950 px-3 text-sm text-white"><option>All</option><option>Low</option><option>Moderate</option><option>Elevated</option><option>High</option></select>}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
        <Card><StockRows /></Card>
        <Card>
          <SectionTitle>Selected Stock</SectionTitle>
          <div className="flex items-center gap-4">
            <ScoreRing score={selected.opportunityScore} />
            <div>
              <div className="text-2xl font-black text-white">{selected.symbol}</div>
              <div className="text-sm text-slate-400">{selected.company}</div>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-300">{selected.reason}</p>
          <div className="mt-4 space-y-2">
            {selected.risks.map((item) => (
              <div key={item} className="flex gap-2 text-sm text-slate-300"><AlertTriangle size={16} className="mt-0.5 text-amber-300" />{item}</div>
            ))}
          </div>
        </Card>
      </div>
    </>
  );
}

export function SectorsPage() {
  return (
    <>
      <PageHeader title="Sector Map" description="Compare sector strength, average performance, best stocks, and risk tone before choosing where to research next." />
      <div className="grid grid-auto-fit gap-4">
        {sectors.map((sector) => (
          <Card key={sector.name}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-lg font-black text-white">{sector.name}</div>
                <div className="mt-1 text-sm text-slate-400">{sector.stocks} stocks scanned</div>
              </div>
              <Badge tone={sector.change >= 0 ? "positive" : "danger"}>{sector.change > 0 ? "+" : ""}{sector.change.toFixed(2)}%</Badge>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Metric label="Sector score" value={`${sector.score}`} tone={sector.score >= 70 ? "positive" : sector.score >= 55 ? "warning" : "danger"} />
              <Metric label="Best stock" value={sector.bestStock} />
            </div>
            <a href={`/sectors/${encodeURIComponent(sector.name)}`} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-300">Open sector <ArrowRight size={16} /></a>
          </Card>
        ))}
      </div>
    </>
  );
}

export function ScreenerPage() {
  return (
    <>
      <PageHeader title="Stock Screener" description="Filter by income quality, valuation, liquidity, and risk labels. This screen is table-first for repeated research sessions." action={<button className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-blue-600 px-4 text-sm font-bold text-white"><Filter size={16} /> Save filter</button>} />
      <Card><StockRows /></Card>
    </>
  );
}

export function DividendRadarPage() {
  return (
    <>
      <PageHeader title="Dividend Radar" description="Prioritize high-quality income candidates while separating sustainable yield from dividend traps." />
      <div className="grid gap-4 lg:grid-cols-3">
        {stocks.slice(0, 6).map((stock) => (
          <Card key={stock.symbol}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-black text-white">{stock.symbol}</div>
                <div className="text-sm text-slate-400">{stock.company}</div>
              </div>
              <ScoreRing score={stock.dividendScore} />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Metric label="Yield" value={`${stock.dividendYield.toFixed(2)}%`} tone="positive" />
              <Metric label="Payout" value={`${stock.payoutRatio}%`} tone={stock.payoutRatio > 70 ? "warning" : "neutral"} />
              <Metric label="Risk" value={stock.riskLevel} tone={stock.riskLevel === "High" ? "danger" : "neutral"} />
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{stock.reason}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

export function StockDetailPage({ symbol }: { symbol: string }) {
  const stock = stocks.find((item) => item.symbol === symbol) ?? stocks[0];
  return (
    <>
      <PageHeader title={`${stock.symbol} Research Detail`} description={`${stock.company} analysis for long-term dividend research. This is not a buy/sell instruction.`} action={<a href="/watchlist" className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-emerald-600 px-4 text-sm font-bold text-white"><Plus size={16} /> Add to watchlist</a>} />
      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <div className="flex items-center gap-5">
            <ScoreRing score={stock.opportunityScore} />
            <div>
              <div className="text-3xl font-black text-white">{stock.symbol}</div>
              <div className="text-slate-400">{stock.sector}</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4">
            <Metric label="Price" value={formatNaira(stock.price)} />
            <Metric label="Daily change" value={`${stock.change > 0 ? "+" : ""}${stock.change.toFixed(2)}%`} tone={stock.change >= 0 ? "positive" : "danger"} />
            <Metric label="Dividend yield" value={`${stock.dividendYield.toFixed(2)}%`} tone="positive" />
            <Metric label="P/E" value={`${stock.pe || "n/a"}`} />
            <Metric label="ROE" value={`${stock.roe}%`} />
            <Metric label="Volume" value={stock.volume.toLocaleString()} />
          </div>
        </Card>
        <Card>
          <SectionTitle>AI Explanation</SectionTitle>
          <p className="text-sm leading-6 text-slate-300">{stock.reason}</p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <ScoreBadge score={stock.dividendScore} />
            <ScoreBadge score={stock.valuationScore} />
            <ScoreBadge score={stock.liquidityScore} />
          </div>
          <div className="mt-5 h-44"><Sparkline values={stock.trend} className="h-44" stroke={stock.change >= 0 ? "#22C55E" : "#EF4444"} /></div>
          <SectionTitle>Risks To Check Before Buying</SectionTitle>
          <div className="grid gap-2">
            {stock.risks.map((risk) => <div key={risk} className="soft-panel rounded-[8px] p-3 text-sm text-slate-300">{risk}</div>)}
          </div>
        </Card>
      </div>
    </>
  );
}

export function WatchlistPage() {
  return (
    <>
      <PageHeader title="Watchlist" description="Track research candidates separately from real holdings. Watchlist decisions remain manual and evidence-based." />
      <div className="grid gap-4 lg:grid-cols-2">
        {watchlist.map((item) => {
          const stock = stocks.find((candidate) => candidate.symbol === item.symbol)!;
          return (
            <Card key={item.symbol}>
              <div className="flex items-start justify-between gap-4">
                <div><div className="text-2xl font-black text-white">{item.symbol}</div><div className="text-sm text-slate-400">{stock.company}</div></div>
                <Badge tone={item.movement >= 0 ? "positive" : "danger"}>{item.movement > 0 ? "+" : ""}{item.movement.toFixed(2)}%</Badge>
              </div>
              <p className="mt-3 text-sm text-slate-300">{item.note}</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <Metric label="Target" value={formatNaira(item.targetPrice)} />
                <Metric label="Current" value={formatNaira(stock.price)} />
                <Metric label="Score" value={`${stock.opportunityScore}`} tone={stock.opportunityScore >= 80 ? "positive" : "warning"} />
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function PortfolioPage({ tab = "Overview" }: { tab?: string }) {
  const nav = [
    ["Overview", "/portfolio"],
    ["Holdings", "/portfolio/holdings"],
    ["Transactions", "/portfolio/transactions"],
    ["Dividends", "/portfolio/dividends"],
    ["Performance", "/portfolio/performance"],
    ["Risk & Allocation", "/portfolio/risk"],
    ["Documents", "/portfolio/documents"],
    ["Broker Setup", "/portfolio/broker-setup"],
  ];

  return (
    <>
      <PageHeader title="Portfolio / Wallet" description="A private ledger for holdings Tony bought manually through Stanbic IBTC Stockbrokers. The app tracks and explains; it never places trades." action={tab === "Transactions" ? <Link href="/portfolio/transactions/new" className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-emerald-600 px-4 text-sm font-bold text-white"><Plus size={16} /> Add transaction</Link> : <Link href="/portfolio/holdings/new" className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-emerald-600 px-4 text-sm font-bold text-white"><Plus size={16} /> Add holding</Link>} />
      <div className="mb-4 flex gap-2 overflow-x-auto thin-scrollbar">
        {nav.map(([label, href]) => <a key={label} href={href} className={`shrink-0 rounded-[8px] border px-3 py-2 text-sm font-bold ${label === tab ? "border-emerald-400 bg-emerald-500/15 text-white" : "border-slate-700 text-slate-400"}`}>{label}</a>)}
      </div>
      {tab === "Overview" && <PortfolioOverview />}
      {tab === "Holdings" && <HoldingsTable />}
      {tab === "Transactions" && <TransactionsTable />}
      {tab === "Dividends" && <DividendsPanel />}
      {tab === "Performance" && <PerformancePanel />}
      {tab === "Risk & Allocation" && <RiskPanel />}
      {tab === "Documents" && <DocumentsPanel />}
      {tab === "Broker Setup" && <BrokerSetupPanel />}
    </>
  );
}

function PortfolioOverview() {
  return (
    <div className="grid gap-4 xl:grid-cols-12">
      <Card className="xl:col-span-8">
        <div className="grid grid-auto-fit gap-4">
          <Metric label="Total portfolio value" value={formatCompactNaira(portfolio.value)} tone="positive" />
          <Metric label="Invested capital" value={formatCompactNaira(portfolio.invested)} />
          <Metric label="Unrealized gain/loss" value={formatCompactNaira(portfolio.gain)} tone={portfolio.gain >= 0 ? "positive" : "danger"} />
          <Metric label="Dividends received" value={formatCompactNaira(portfolio.dividends)} tone="positive" />
          <Metric label="Expected annual dividend" value={formatCompactNaira(portfolio.expected)} tone="positive" />
          <Metric label="Yield on cost" value={`${portfolio.yieldOnCost.toFixed(2)}%`} />
        </div>
      </Card>
      <Card className="xl:col-span-4">
        <SectionTitle>Allocation</SectionTitle>
        <DonutChart slices={[{ label: "Banking", value: 48.2, color: "#3B82F6" }, { label: "Telecom/ICT", value: 25.8, color: "#10B981" }, { label: "Consumer Goods", value: 17.3, color: "#EAB308" }, { label: "Other", value: 8.7, color: "#64748B" }]} />
      </Card>
      <Card className="xl:col-span-12">
        <SectionTitle>AI Portfolio Briefing</SectionTitle>
        <p className="text-sm leading-6 text-slate-300">Your portfolio is profitable and income-producing, but Banking is close to the concentration review zone. GTCO and Zenith still fit the strategy on current data. MTNN adds useful sector diversification. BUA Foods should be reviewed mainly for valuation discipline.</p>
      </Card>
    </div>
  );
}

function HoldingsTable() {
  return (
    <Card>
      <div className="overflow-x-auto thin-scrollbar">
        <table className="w-full min-w-[1000px] text-left text-sm">
          <thead className="text-[11px] uppercase text-slate-500"><tr><th className="py-3">Stock</th><th>Broker</th><th>Qty</th><th>Avg cost</th><th>Current</th><th>Value</th><th>Gain/Loss</th><th>Dividends</th><th>Risk</th><th>Action</th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {holdings.map((holding) => {
              const value = holding.quantity * holding.currentPrice;
              const gain = value - holding.quantity * holding.averagePrice;
              return <tr key={holding.id} className="hover:bg-slate-900/60"><td className="py-4"><div className="font-black text-white">{holding.symbol}</div><div className="text-xs text-slate-500">{holding.company}</div></td><td>{holding.broker}</td><td>{holding.quantity.toLocaleString()}</td><td>{formatNaira(holding.averagePrice)}</td><td>{formatNaira(holding.currentPrice)}</td><td>{formatCompactNaira(value)}</td><td className={gain >= 0 ? "font-bold text-emerald-400" : "font-bold text-red-400"}>{formatCompactNaira(gain)}</td><td>{formatCompactNaira(holding.dividendsReceived)}</td><td><Badge tone={holding.riskLevel === "Low" ? "positive" : "warning"}>{holding.riskLevel}</Badge></td><td><a className="text-blue-300" href={`/portfolio/holdings/${holding.id}`}>Review</a></td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export function HoldingDetailPage({ holdingId }: { holdingId: string }) {
  const detail = getHoldingDetail(holdingId);

  if (!detail) {
    return (
      <>
        <PageHeader title="Holding Not Found" description="This portfolio holding could not be matched to the local ledger." action={<Link href="/portfolio/holdings" className="inline-flex h-10 items-center rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">Back to holdings</Link>} />
        <Card><p className="text-sm leading-6 text-slate-300">Check the holding ID, import the missing ledger record, or return to the holdings table.</p></Card>
      </>
    );
  }

  const { holding, stock, position } = detail;
  const metricTone = position.unrealizedGain >= 0 ? "positive" : "danger";

  return (
    <>
      <PageHeader
        title={`${holding.symbol} Holding`}
        description={`${holding.company} position held through ${holding.broker}. This page reviews the local portfolio record, market scanner evidence, documents, and AI holding review without placing trades.`}
        action={<Link href="/portfolio/holdings" className="inline-flex h-10 items-center rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">Back to holdings</Link>}
      />

      <div className="mb-4 grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="text-sm font-bold text-emerald-300">{holding.sector}</div>
              <h2 className="mt-2 text-4xl font-black text-white">{holding.symbol}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{holding.thesis}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge tone={holding.riskLevel === "Low" ? "positive" : "warning"}>{holding.riskLevel}</Badge>
              <Badge tone={detail.aiReview.label === "Review" ? "warning" : "primary"}>{detail.aiReview.label}</Badge>
            </div>
          </div>
          <div className="mt-5 grid grid-auto-fit gap-4">
            <Metric label="Quantity" value={holding.quantity.toLocaleString()} />
            <Metric label="Average buy price" value={formatNaira(holding.averagePrice)} />
            <Metric label="Current price" value={formatNaira(holding.currentPrice)} />
            <Metric label="Current value" value={formatCompactNaira(position.currentValue)} tone="positive" />
            <Metric label="Total cost" value={formatCompactNaira(position.totalCost)} />
            <Metric label="Unrealized gain/loss" value={`${formatCompactNaira(position.unrealizedGain)} (${position.unrealizedGainPercent.toFixed(2)}%)`} tone={metricTone} />
            <Metric label="Dividend received" value={formatCompactNaira(holding.dividendsReceived)} tone="positive" />
            <Metric label="Yield on cost" value={`${position.yieldOnCost.toFixed(2)}%`} />
            <Metric label="Portfolio weight" value={`${position.portfolioWeightPercent.toFixed(2)}%`} tone={position.portfolioWeightPercent > 25 ? "warning" : "neutral"} />
          </div>
        </Card>

        <Card>
          <SectionTitle>AI Holding Review</SectionTitle>
          <p className="soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-300">{detail.aiReview.summary}</p>
          <div className="mt-4 grid gap-3">
            {detail.aiReview.facts.map((fact) => <div key={fact} className="soft-panel rounded-[8px] p-3 text-sm text-slate-300">{fact}</div>)}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <SectionTitle>Market Intelligence</SectionTitle>
          {stock ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Metric label="Opportunity" value={`${stock.opportunityScore}/100`} tone="positive" />
                <Metric label="Dividend score" value={`${stock.dividendScore}/100`} tone="positive" />
                <Metric label="Valuation" value={`${stock.valuationScore}/100`} />
                <Metric label="Liquidity" value={`${stock.liquidityScore}/100`} />
              </div>
              <Sparkline values={stock.trend} className="h-24" stroke={stock.change >= 0 ? "#22C55E" : "#EF4444"} />
              <p className="text-sm leading-6 text-slate-300">{stock.reason}</p>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-300">No linked market scanner record is available for this holding.</p>
          )}
        </Card>

        <Card>
          <SectionTitle>Risks To Watch</SectionTitle>
          <div className="space-y-3">
            {detail.aiReview.risks.map((risk) => (
              <div key={risk} className="soft-panel rounded-[8px] p-3 text-sm leading-6 text-slate-300">
                <AlertTriangle className="mb-2 text-amber-300" size={18} />
                {risk}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionTitle>Documents</SectionTitle>
          <div className="space-y-3">
            {detail.documents.length === 0 && <div className="soft-panel rounded-[8px] p-3 text-sm text-slate-300">No local document metadata is linked yet.</div>}
            {detail.documents.map((document) => (
              <div key={document.title} className="soft-panel rounded-[8px] p-3">
                <div className="font-bold text-white">{document.title}</div>
                <div className="mt-1 text-xs leading-5 text-slate-400">{document.type} - {document.date}</div>
                <div className="mt-1 font-mono text-[11px] text-slate-500">{document.path}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Transactions</SectionTitle>
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-[11px] uppercase text-slate-500"><tr><th className="py-3">Date</th><th>Type</th><th>Quantity</th><th>Price</th><th>Charges</th><th>Net amount</th><th>Reference</th></tr></thead>
              <tbody className="divide-y divide-slate-800">
                {detail.transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-slate-900/60">
                    <td className="py-4 font-bold text-white">{transaction.date}</td>
                    <td>{transaction.type}</td>
                    <td>{transaction.quantity.toLocaleString()}</td>
                    <td>{formatNaira(transaction.price)}</td>
                    <td>{formatCompactNaira(transaction.charges)}</td>
                    <td>{formatCompactNaira(transaction.netAmount)}</td>
                    <td className="text-slate-400">{transaction.reference}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}

const holdingTags: HoldingDraftTag[] = ["Core Holding", "Dividend Income", "Value Play", "Defensive", "Speculative", "Learning Position"];

export function AddHoldingPage() {
  const [form, setForm] = useState<HoldingDraftInput>({
    symbol: "GTCO",
    buyDate: "2026-06-08",
    settlementDate: "",
    quantity: 1000,
    buyPrice: 72.5,
    charges: 1500,
    vatFees: 0,
    personalReason: "Long-term dividend research candidate.",
    thesis: "Manual Stanbic IBTC purchase after reviewing scanner evidence.",
    targetHoldingPeriod: "3-5 years",
    dividendExpectation: "Income plus moderate capital appreciation.",
    riskConcern: "Banking concentration and market data freshness.",
    tag: "Dividend Income",
    contractNoteReference: "",
  });
  const draft = buildHoldingDraft(form);
  const issues = validateHoldingDraft(draft);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  function updateField<K extends keyof HoldingDraftInput>(field: K, value: HoldingDraftInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <PageHeader
        title="Add Holding"
        description="Record a completed manual purchase from Stanbic IBTC. This creates a local draft for review; it does not place a trade or contact the broker."
        action={<Link href="/portfolio/holdings" className="inline-flex h-10 items-center rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">Back to holdings</Link>}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <SectionTitle
            action={
              <Badge tone={draft.dataStatus === "linked" ? "positive" : "warning"}>
                <span className="hidden sm:inline">{draft.dataStatus === "linked" ? "Linked to scanner" : "Incomplete data"}</span>
                <span className="sm:hidden">{draft.dataStatus === "linked" ? "Linked" : "Incomplete"}</span>
              </Badge>
            }
          >
            Manual Entry
          </SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Stock symbol">
              <input className={fieldClass} value={form.symbol} onChange={(event) => updateField("symbol", event.target.value)} />
            </FormField>
            <FormField label="Company">
              <input className={fieldClass} value={draft.company} onChange={(event) => updateField("company", event.target.value)} />
            </FormField>
            <FormField label="Broker used">
              <input className={fieldClass} value={draft.broker} onChange={(event) => updateField("broker", event.target.value)} />
            </FormField>
            <FormField label="Broker account nickname">
              <input className={fieldClass} value={draft.brokerAccountNickname} onChange={(event) => updateField("brokerAccountNickname", event.target.value)} />
            </FormField>
            <FormField label="Buy date">
              <input type="date" className={fieldClass} value={form.buyDate ?? ""} onChange={(event) => updateField("buyDate", event.target.value)} />
            </FormField>
            <FormField label="Settlement date">
              <input type="date" className={fieldClass} value={form.settlementDate ?? ""} onChange={(event) => updateField("settlementDate", event.target.value)} />
            </FormField>
            <FormField label="Quantity bought">
              <input type="number" min="0" className={fieldClass} value={form.quantity} onChange={(event) => updateField("quantity", Number(event.target.value))} />
            </FormField>
            <FormField label="Buy price per share">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.buyPrice} onChange={(event) => updateField("buyPrice", Number(event.target.value))} />
            </FormField>
            <FormField label="Brokerage / transaction charges">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.charges ?? 0} onChange={(event) => updateField("charges", Number(event.target.value))} />
            </FormField>
            <FormField label="VAT / fees">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.vatFees ?? 0} onChange={(event) => updateField("vatFees", Number(event.target.value))} />
            </FormField>
            <FormField label="CSCS account number">
              <input className={fieldClass} value={draft.cscsNumber} onChange={(event) => updateField("cscsNumber", event.target.value)} />
            </FormField>
            <FormField label="CHN reference">
              <input className={fieldClass} value={draft.chn} onChange={(event) => updateField("chn", event.target.value)} />
            </FormField>
            <FormField label="Contract note reference">
              <input className={fieldClass} value={form.contractNoteReference ?? ""} onChange={(event) => updateField("contractNoteReference", event.target.value)} placeholder="SIBTC-CN-..." />
            </FormField>
            <FormField label="Tag">
              <select className={fieldClass} value={draft.tag} onChange={(event) => updateField("tag", event.target.value as HoldingDraftTag)}>
                {holdingTags.map((tag) => <option key={tag}>{tag}</option>)}
              </select>
            </FormField>
            <FormField label="Personal reason">
              <textarea className={`${fieldClass} min-h-24 resize-none py-3`} value={form.personalReason ?? ""} onChange={(event) => updateField("personalReason", event.target.value)} />
            </FormField>
            <FormField label="Investment thesis">
              <textarea className={`${fieldClass} min-h-24 resize-none py-3`} value={form.thesis ?? ""} onChange={(event) => updateField("thesis", event.target.value)} />
            </FormField>
            <FormField label="Target holding period">
              <input className={fieldClass} value={form.targetHoldingPeriod ?? ""} onChange={(event) => updateField("targetHoldingPeriod", event.target.value)} />
            </FormField>
            <FormField label="Dividend expectation">
              <input className={fieldClass} value={form.dividendExpectation ?? ""} onChange={(event) => updateField("dividendExpectation", event.target.value)} />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Risk concern at entry">
                <textarea className={`${fieldClass} min-h-24 resize-none py-3`} value={form.riskConcern ?? ""} onChange={(event) => updateField("riskConcern", event.target.value)} />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Cost Preview</SectionTitle>
            <div className="grid gap-4">
              <Metric label="Gross purchase value" value={formatCompactNaira(draft.grossPurchaseValue)} />
              <Metric label="Total cost after charges" value={formatCompactNaira(draft.totalCost)} tone="positive" />
              <Metric label="Average cost per share" value={formatNaira(draft.averageCostPerShare)} />
              <Metric label="Latest scanner price" value={draft.currentPrice ? formatNaira(draft.currentPrice) : "Missing"} tone={draft.currentPrice ? "neutral" : "warning"} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Validation</SectionTitle>
            {issues.length === 0 && <div className="soft-panel rounded-[8px] p-4 text-sm text-emerald-200">Ready to save locally when persistence is enabled. Trade execution remains manual through Stanbic IBTC.</div>}
            {errors.length > 0 && <IssueList title="Errors" issues={errors.map((issue) => issue.message)} tone="danger" />}
            {warnings.length > 0 && <IssueList title="Warnings" issues={warnings.map((issue) => issue.message)} tone="warning" />}
            <div className="mt-4 soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-300">
              Documents should be stored under <span className="font-mono text-slate-100">data/documents/</span>; this draft stores only metadata and local file paths.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

const fieldClass = "h-11 w-full rounded-[8px] border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition focus:border-emerald-400";

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function IssueList({ title, issues, tone }: { title: string; issues: string[]; tone: "warning" | "danger" }) {
  return (
    <div className="mb-3 soft-panel rounded-[8px] p-4">
      <Badge tone={tone}>{title}</Badge>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
        {issues.map((issue) => (
          <li key={issue} className="flex gap-2">
            <AlertTriangle className={tone === "danger" ? "mt-0.5 shrink-0 text-red-300" : "mt-0.5 shrink-0 text-amber-300"} size={16} />
            <span>{issue}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TransactionsTable() {
  return <Card><SectionTitle>Transaction Ledger</SectionTitle><div className="space-y-3">{transactions.map((item) => <div key={item.id} className="soft-panel grid gap-2 rounded-[8px] p-3 text-sm md:grid-cols-6"><span className="font-bold text-white">{item.date}</span><span>{item.symbol}</span><span>{item.type}</span><span>{item.quantity.toLocaleString()}</span><span>{formatCompactNaira(item.netAmount)}</span><span className="text-slate-400">{item.reference}</span></div>)}</div></Card>;
}

const transactionTypes: TransactionDraftType[] = ["Buy", "Sell", "Dividend Received", "Bonus Shares", "Rights Issue", "Stock Split", "Fee/Charge", "Manual Adjustment", "Transfer Between Brokers"];

export function AddTransactionPage() {
  const [form, setForm] = useState<TransactionDraftInput>({
    symbol: "GTCO",
    type: "Buy",
    transactionDate: "2026-06-08",
    settlementDate: "2026-06-11",
    quantity: 1000,
    price: 72.5,
    charges: 1500,
    withholdingTax: 0,
    reference: "SIBTC-CN-NEW",
    notes: "Manual Stanbic IBTC transaction record.",
    uploadedDocumentPath: "data/documents/",
  });
  const draft = buildTransactionDraft(form);
  const issues = validateTransactionDraft(draft);
  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");

  function updateField<K extends keyof TransactionDraftInput>(field: K, value: TransactionDraftInput[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <PageHeader
        title="Add Transaction"
        description="Record a completed portfolio movement from Stanbic IBTC. This is a local ledger draft only; it never sends broker instructions or places trades."
        action={<Link href="/portfolio/transactions" className="inline-flex h-10 items-center rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">Back to transactions</Link>}
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card>
          <SectionTitle action={<Badge tone={draft.dataStatus === "linked" ? "positive" : "warning"}>{draft.dataStatus === "linked" ? "Linked" : "Incomplete"}</Badge>}>Transaction Entry</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Transaction type">
              <select className={fieldClass} value={form.type} onChange={(event) => updateField("type", event.target.value as TransactionDraftType)}>
                {transactionTypes.map((type) => <option key={type}>{type}</option>)}
              </select>
            </FormField>
            <FormField label="Stock symbol">
              <input className={fieldClass} value={form.symbol} onChange={(event) => updateField("symbol", event.target.value)} />
            </FormField>
            <FormField label="Broker">
              <input className={fieldClass} value={draft.broker} onChange={(event) => updateField("broker", event.target.value)} />
            </FormField>
            <FormField label="Company">
              <input className={fieldClass} value={draft.company || "Unlinked symbol"} readOnly />
            </FormField>
            <FormField label="Transaction date">
              <input type="date" className={fieldClass} value={form.transactionDate} onChange={(event) => updateField("transactionDate", event.target.value)} />
            </FormField>
            <FormField label="Settlement date">
              <input type="date" className={fieldClass} value={form.settlementDate ?? ""} onChange={(event) => updateField("settlementDate", event.target.value)} />
            </FormField>
            <FormField label="Quantity">
              <input type="number" min="0" className={fieldClass} value={form.quantity} onChange={(event) => updateField("quantity", Number(event.target.value))} />
            </FormField>
            <FormField label="Price / amount per share">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.price} onChange={(event) => updateField("price", Number(event.target.value))} />
            </FormField>
            <FormField label="Charges">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.charges ?? 0} onChange={(event) => updateField("charges", Number(event.target.value))} />
            </FormField>
            <FormField label="Withholding tax">
              <input type="number" min="0" step="0.01" className={fieldClass} value={form.withholdingTax ?? 0} onChange={(event) => updateField("withholdingTax", Number(event.target.value))} />
            </FormField>
            <FormField label="Reference number">
              <input className={fieldClass} value={form.reference ?? ""} onChange={(event) => updateField("reference", event.target.value)} />
            </FormField>
            <FormField label="Uploaded document path">
              <input className={fieldClass} value={form.uploadedDocumentPath ?? ""} onChange={(event) => updateField("uploadedDocumentPath", event.target.value)} />
            </FormField>
            <div className="md:col-span-2">
              <FormField label="Notes">
                <textarea className={`${fieldClass} min-h-28 resize-none py-3`} value={form.notes ?? ""} onChange={(event) => updateField("notes", event.target.value)} />
              </FormField>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Ledger Effect</SectionTitle>
            <div className="grid gap-4">
              <Metric label="Gross amount" value={formatCompactNaira(draft.grossAmount)} />
              <Metric label="Net amount" value={formatCompactNaira(draft.netAmount)} tone={draft.type === "Dividend Received" ? "positive" : "neutral"} />
              <Metric label="Quantity change" value={draft.effect.quantityChange.toLocaleString()} tone={draft.effect.quantityChange >= 0 ? "positive" : "danger"} />
              <Metric label="Cost basis change" value={formatCompactNaira(draft.effect.costBasisChange)} />
              <Metric label="Income change" value={formatCompactNaira(draft.effect.incomeChange)} tone={draft.effect.incomeChange > 0 ? "positive" : "neutral"} />
            </div>
          </Card>

          <Card>
            <SectionTitle>Validation</SectionTitle>
            {issues.length === 0 && <div className="soft-panel rounded-[8px] p-4 text-sm text-emerald-200">Ready to save locally when persistence is enabled. Broker execution remains manual through Stanbic IBTC.</div>}
            {errors.length > 0 && <IssueList title="Errors" issues={errors.map((issue) => issue.message)} tone="danger" />}
            {warnings.length > 0 && <IssueList title="Warnings" issues={warnings.map((issue) => issue.message)} tone="warning" />}
            <div className="mt-4 soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-300">
              Buy and rights issue entries increase quantity and cost basis. Dividend entries increase income only. Bonus shares increase quantity without cost.
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

function DividendsPanel() {
  return <Card><SectionTitle>Dividend Tracker</SectionTitle><div className="grid grid-auto-fit gap-4">{holdings.map((holding) => <div key={holding.id} className="soft-panel rounded-[8px] p-4"><div className="text-xl font-black text-white">{holding.symbol}</div><Metric label="Received" value={formatCompactNaira(holding.dividendsReceived)} tone="positive" /><Metric label="Expected annual" value={formatCompactNaira(holding.expectedAnnualDividend)} tone="positive" /></div>)}</div></Card>;
}

function PerformancePanel() {
  return <Card><SectionTitle>Performance</SectionTitle><div className="grid gap-4 lg:grid-cols-2">{holdings.map((holding) => <div key={holding.id} className="soft-panel rounded-[8px] p-4"><div className="mb-2 flex items-center justify-between"><span className="font-black text-white">{holding.symbol}</span><Badge tone={holding.currentPrice >= holding.averagePrice ? "positive" : "danger"}>{(((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100).toFixed(1)}%</Badge></div><Sparkline values={stocks.find((stock) => stock.symbol === holding.symbol)?.trend ?? [1, 2, 3]} /></div>)}</div></Card>;
}

function RiskPanel() {
  return <Card><SectionTitle>Risk & Allocation</SectionTitle><div className="grid grid-auto-fit gap-4">{["Banking is 48.2% of current value; watch the 50% review threshold.", "No single stock is above the 25% hard review threshold.", "Low-liquidity exposure is controlled, but Oil & Gas watchlist names need caution.", "Dividend income depends heavily on tier-one banks."].map((risk) => <div key={risk} className="soft-panel rounded-[8px] p-4 text-sm text-slate-300"><AlertTriangle className="mb-3 text-amber-300" size={20} />{risk}</div>)}</div></Card>;
}

function DocumentsPanel() {
  return <Card><SectionTitle>Documents</SectionTitle><div className="grid gap-3">{documents.map((doc) => <div key={doc.title} className="soft-panel flex items-center justify-between gap-3 rounded-[8px] p-4"><div className="flex items-center gap-3"><FileText className="text-blue-300" /><div><div className="font-bold text-white">{doc.title}</div><div className="text-xs text-slate-400">{doc.type} · {doc.path}</div></div></div><Badge>{doc.date}</Badge></div>)}</div></Card>;
}

function BrokerSetupPanel() {
  return <div className="grid gap-4 lg:grid-cols-[1fr_1fr]"><Card><SectionTitle>Broker Profile</SectionTitle><div className="grid gap-3 text-sm"><div className="soft-panel rounded-[8px] p-3"><span className="text-slate-400">Broker</span><div className="font-bold text-white">{brokerSetup.brokerName}</div></div><div className="soft-panel rounded-[8px] p-3"><span className="text-slate-400">CSCS</span><div className="font-bold text-white">{brokerSetup.cscsNumber}</div></div><div className="soft-panel rounded-[8px] p-3"><span className="text-slate-400">CHN</span><div className="font-bold text-white">{brokerSetup.chn}</div></div></div></Card><Card><SectionTitle>Setup Checklist</SectionTitle><div className="space-y-2">{brokerSetup.checklist.map((item) => <div key={item.label} className="flex items-center gap-3 text-sm text-slate-300"><CheckCircle2 className={item.done ? "text-emerald-400" : "text-slate-600"} size={18} />{item.label}</div>)}</div></Card></div>;
}

export function AlertsPage() {
  return <><PageHeader title="Alerts" description="Risk is first-class. These warnings should be reviewed before adding a stock to watchlist or portfolio." /><div className="grid gap-4 lg:grid-cols-3">{alerts.map((alert) => <Card key={alert.title}><Badge tone={alert.severity === "danger" ? "danger" : alert.severity === "warning" ? "warning" : "primary"}>{alert.count} active</Badge><h2 className="mt-4 text-xl font-black text-white">{alert.title}</h2><p className="mt-3 text-sm leading-6 text-slate-300">{alert.detail}</p></Card>)}</div></>;
}

export function AssistantPage() {
  const samplePrompts = ["Compare GTCO with Zenith and UBA", "Am I overexposed to banking?", "Which holding needs attention?", "Give me a dividend market briefing"];
  const [question, setQuestion] = useState(samplePrompts[0]);
  const [result, setResult] = useState<AssistantAnswer | null>(null);
  const [status, setStatus] = useState<"idle" | "asking" | "failed">("idle");

  async function askAssistant(nextQuestion = question) {
    const trimmed = nextQuestion.trim();
    if (!trimmed) return;

    setQuestion(trimmed);
    setStatus("asking");

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!response.ok) throw new Error("Assistant request failed");

      const payload = (await response.json()) as AssistantAnswer;
      setResult(payload);
      setStatus("idle");
    } catch {
      setStatus("failed");
    }
  }

  return (
    <>
      <PageHeader title="AI Assistant" description="Ask about the local market snapshot or portfolio. Responses are constrained to available data and do not issue direct buy/sell instructions." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <SectionTitle action={<Badge tone="primary">Local data</Badge>}>Ask</SectionTitle>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              askAssistant();
            }}
          >
            <textarea
              className="min-h-32 w-full resize-none rounded-[8px] border border-slate-700 bg-slate-950 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition focus:border-blue-400"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Compare GTCO with Zenith and UBA..."
            />
            <button disabled={status === "asking"} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-indigo-600 px-4 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              <Bot size={17} /> {status === "asking" ? "Analyzing..." : "Ask Assistant"}
            </button>
          </form>

          <div className="mt-5 space-y-2">
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => askAssistant(prompt)}
                className="soft-panel w-full rounded-[8px] p-3 text-left text-sm font-semibold text-slate-200 transition hover:border-blue-400/60 hover:bg-blue-500/10"
              >
                {prompt}
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle action={result ? <Badge tone={result.suggestedLabel === "Review" ? "warning" : result.suggestedLabel === "Needs data" ? "danger" : "positive"}>{result.suggestedLabel}</Badge> : undefined}>Response</SectionTitle>
            {status === "failed" && <div className="soft-panel rounded-[8px] border-red-500/50 bg-red-500/10 p-4 text-sm text-red-200">The assistant could not complete that request. Try again with a portfolio, sector, or scanned-stock question.</div>}
            {!result && status !== "failed" && <div className="soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-300">Ask a question or choose a prompt to generate a local, evidence-backed response. The assistant will only use the current app data snapshot.</div>}
            {result && (
              <div className="space-y-4">
                <div className="soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-200">{result.answer}</div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <AssistantList title="Facts" items={result.facts} tone="text-emerald-300" />
                  <AssistantList title="Interpretation" items={result.interpretation} tone="text-blue-300" />
                  <AssistantList title="Risks & Missing Data" items={result.risks} tone="text-amber-300" />
                  <AssistantList title="Guardrails" items={[result.dataStatus, ...result.guardrails]} tone="text-slate-300" />
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function AssistantList({ title, items, tone }: { title: string; items: string[]; tone: string }) {
  return (
    <div className="soft-panel rounded-[8px] p-4">
      <div className={`mb-3 text-xs font-black uppercase ${tone}`}>{title}</div>
      <ul className="space-y-2 text-sm leading-6 text-slate-300">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-500" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>("daily-market-briefing");
  const [report, setReport] = useState<GeneratedReport>(() => generateReport("daily-market-briefing"));

  function selectReport(nextType: ReportType) {
    setReportType(nextType);
    setReport(generateReport(nextType));
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate structured local market and portfolio reports for review. Markdown, CSV, and JSON backup exports are available now; PDF remains a later formatter."
        action={
          <div className="flex flex-wrap gap-2">
            <a href={`/api/reports?type=${reportType}&format=markdown&download=true`} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-blue-600 px-4 text-sm font-bold text-white">
              <Download size={16} /> Markdown
            </a>
            <a href={`/api/reports?type=${reportType}&format=csv&download=true`} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">
              CSV
            </a>
            <a href={`/api/reports?type=${reportType}&format=json&download=true`} className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-slate-700 px-4 text-sm font-bold text-slate-100">
              JSON
            </a>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Card>
          <SectionTitle>Report Types</SectionTitle>
          <div className="space-y-3">
            {reportDefinitions.map((definition) => (
              <button
                key={definition.id}
                onClick={() => selectReport(definition.id)}
                className={`soft-panel w-full rounded-[8px] p-4 text-left transition hover:bg-slate-800/60 ${reportType === definition.id ? "border-blue-400/60 bg-blue-500/10" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-black text-white">{definition.title}</div>
                    <div className="mt-2 text-xs leading-5 text-slate-400">{definition.description}</div>
                  </div>
                  <Badge tone={definition.cadence === "Daily" ? "positive" : definition.cadence === "Weekly" ? "primary" : "neutral"}>{definition.cadence}</Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle action={<Badge tone="positive">Generated locally</Badge>}>Report Preview</SectionTitle>
            <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-end">
              <div>
                <h2 className="text-2xl font-black text-white">{report.title}</h2>
                <p className="mt-2 text-sm text-slate-400">Generated: {report.generatedAt}</p>
              </div>
              <div className="text-sm text-slate-300">No broker login, no trade execution, local research only.</div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">{report.summary}</p>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            {report.sections.map((section) => (
              <Card key={section.title}>
                <SectionTitle>{section.title}</SectionTitle>
                <div className="space-y-3">
                  {section.lines.slice(0, 5).map((line) => (
                    <div key={line} className="soft-panel rounded-[8px] p-3 text-sm leading-5 text-slate-300">
                      {line}
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export function ImportsPage() {
  const [kind, setKind] = useState<ImportKind>("prices");
  const [sourceName, setSourceName] = useState("Manual NGX price snapshot");
  const [sourceType, setSourceType] = useState(importTemplates.prices.sourceType);
  const [csv, setCsv] = useState(importTemplates.prices.csv);
  const [result, setResult] = useState<ImportValidationResult | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "validated" | "needs_review" | "failed">("idle");
  const [message, setMessage] = useState("Paste a CSV or load a template, then run quality checks before saving locally.");

  function loadTemplate(nextKind: ImportKind) {
    setKind(nextKind);
    setSourceType(importTemplates[nextKind].sourceType);
    setSourceName(`${importTemplates[nextKind].label} import`);
    setCsv(importTemplates[nextKind].csv);
    setResult(null);
    setStatus("idle");
    setMessage("Template loaded. Run quality checks before using it as local data.");
  }

  async function validateCsv() {
    setStatus("checking");
    const response = await fetch("/api/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, sourceName, sourceType, csv }),
    });
    const payload = await response.json();
    setStatus(payload.status ?? "failed");
    setMessage(payload.message ?? "Import validation failed.");
    setResult(payload.result ?? null);
  }

  return (
    <>
      <PageHeader
        title="Import Data"
        description="Validate NGX prices, dividend history, company reference data, and Stanbic IBTC portfolio CSVs before they become local records."
        action={
          <button onClick={validateCsv} className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-emerald-600 px-4 text-sm font-bold text-white">
            <Upload size={16} /> Run quality checks
          </button>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[360px_1fr]">
        <Card>
          <SectionTitle>CSV Templates</SectionTitle>
          <div className="grid gap-3">
            {(Object.keys(importTemplates) as ImportKind[]).map((templateKind) => (
              <button
                key={templateKind}
                onClick={() => loadTemplate(templateKind)}
                className={`soft-panel rounded-[8px] p-4 text-left transition hover:bg-slate-800/60 ${kind === templateKind ? "border-emerald-400/60 bg-emerald-500/10" : ""}`}
              >
                <div className="text-sm font-black text-white">{importTemplates[templateKind].label}</div>
                <div className="mt-1 text-xs text-slate-400">{importTemplates[templateKind].sourceType}</div>
              </button>
            ))}
          </div>

          <SectionTitle>Data Source Manager</SectionTitle>
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-500">
              Source name
              <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} className="mt-2 h-10 w-full rounded-[8px] border border-slate-700 bg-slate-950 px-3 text-sm normal-case text-white outline-none" />
            </label>
            <label className="block text-xs font-bold uppercase text-slate-500">
              Source type
              <select value={sourceType} onChange={(event) => setSourceType(event.target.value)} className="mt-2 h-10 w-full rounded-[8px] border border-slate-700 bg-slate-950 px-3 text-sm normal-case text-white outline-none">
                {["Manual CSV", "Stanbic IBTC Broker Export", "Broker Export", "NGX API", "Vendor API", "Custom URL"].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </label>
            <div className="soft-panel rounded-[8px] p-3 text-xs leading-5 text-slate-300">
              Authentication is not required for manual CSV. API/vendor sources remain future connectors.
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <SectionTitle>CSV Input</SectionTitle>
            <textarea
              value={csv}
              onChange={(event) => setCsv(event.target.value)}
              spellCheck={false}
              className="min-h-[280px] w-full resize-y rounded-[8px] border border-slate-700 bg-slate-950/70 p-4 font-mono text-xs leading-5 text-slate-100 outline-none focus:border-blue-400/70"
            />
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-slate-400">{message}</div>
              <Badge tone={status === "validated" ? "positive" : status === "needs_review" ? "warning" : status === "failed" ? "danger" : "neutral"}>{status.replace("_", " ")}</Badge>
            </div>
          </Card>

          <Card>
            <SectionTitle>Data Quality Checks</SectionTitle>
            {result ? (
              <>
                <div className="grid grid-auto-fit gap-4">
                  <Metric label="Rows scanned" value={`${result.rowCount}`} />
                  <Metric label="Valid rows" value={`${result.validRows}`} tone={result.validRows > 0 ? "positive" : "neutral"} />
                  <Metric label="Rejected rows" value={`${result.rejectedRows}`} tone={result.rejectedRows > 0 ? "danger" : "positive"} />
                  <Metric label="Issues found" value={`${result.issues.length}`} tone={result.issues.length > 0 ? "warning" : "positive"} />
                </div>
                <div className="mt-4 max-h-72 space-y-2 overflow-y-auto thin-scrollbar">
                  {result.issues.length === 0 ? (
                    <div className="soft-panel rounded-[8px] p-4 text-sm text-emerald-300">No blocking issues found. This import is ready for the local SQLite persistence step.</div>
                  ) : (
                    result.issues.map((issue, index) => (
                      <div key={`${issue.row}-${issue.field}-${index}`} className="soft-panel flex gap-3 rounded-[8px] p-3 text-sm">
                        <Badge tone={issue.severity === "error" ? "danger" : "warning"}>{issue.severity}</Badge>
                        <div>
                          <div className="font-bold text-white">Row {issue.row} · {issue.field}</div>
                          <div className="text-slate-400">{issue.message}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div className="soft-panel rounded-[8px] p-4 text-sm leading-6 text-slate-300">
                Checks include missing symbol, duplicate symbol, invalid price, missing sector, stale date, suspicious dividend amount, zero volume, and Stanbic broker-workflow mismatches.
              </div>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

export function SettingsPage() {
  return <><PageHeader title="Settings" description="Configure local-first behavior, AI provider preferences, data refresh cadence, broker defaults, and privacy guardrails." /><div className="grid gap-4 lg:grid-cols-2"><Card><SectionTitle>Local App</SectionTitle><div className="space-y-3 text-sm text-slate-300"><div>Database path: <span className="font-mono text-slate-100">data/ngx-radar.db</span></div><div>Documents path: <span className="font-mono text-slate-100">data/documents/</span></div><div>Exports path: <span className="font-mono text-slate-100">exports/</span></div></div></Card><Card><SectionTitle>AI Guardrails</SectionTitle><p className="text-sm leading-6 text-slate-300">Use structured data first, disclose stale or missing data, avoid public advisory language, and never automate broker login or trade placement.</p></Card></div></>;
}
