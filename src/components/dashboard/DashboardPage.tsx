"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  Bell,
  Clock,
  Database,
  Flame,
  Info,
  LineChart,
  Plus,
  RefreshCcw,
  ShieldAlert,
  Sparkles,
  Star,
  Trophy,
} from "lucide-react";
import { alerts, aiBriefing, changedItems, dataSource, holdings, lastUpdated, portfolio, scoreDistribution, sectors, stocks, watchlist } from "@/lib/data";
import { formatCompactNaira, formatNaira } from "@/lib/scoring";
import { Badge, Card, Metric, ScoreBadge, SectionTitle } from "@/components/ui/Primitives";
import { BarDistribution, DonutChart, ScoreRing, Sparkline } from "./Charts";

export function DashboardPage() {
  const [watchlisted, setWatchlisted] = useState<Set<string>>(new Set(["GTCO", "MTNN"]));
  const [selectedSector, setSelectedSector] = useState("Banking");
  const topStock = stocks[0];
  const marketPulse = useMemo(() => {
    const advancing = stocks.filter((stock) => stock.change > 0).length;
    const declining = stocks.filter((stock) => stock.change < 0).length;
    const unchanged = stocks.length - advancing - declining;
    return { total: stocks.length * 24, advancing, declining, unchanged };
  }, []);

  function toggleWatchlist(symbol: string) {
    setWatchlisted((current) => {
      const next = new Set(current);
      if (next.has(symbol)) next.delete(symbol);
      else next.add(symbol);
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <LineChart size={17} className="text-emerald-400" /> Market Pulse
            </span>
          </SectionTitle>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-4xl font-black text-white">{marketPulse.total}</div>
              <div className="mt-1 text-sm text-slate-300">Total stocks scanned</div>
            </div>
            <Badge tone="positive">Fresh scan</Badge>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4 border-b border-slate-700/60 pb-4">
            <Metric label="Advancing" value={`${marketPulse.advancing * 15}`} tone="positive" />
            <Metric label="Declining" value={`${marketPulse.declining * 12}`} tone="danger" />
            <Metric label="Unchanged" value={`${marketPulse.unchanged * 20}`} tone="warning" />
          </div>
          <Sparkline values={[29, 35, 42, 39, 31, 27, 34, 37, 41, 46, 40, 44, 50, 52, 47, 58, 55, 53, 46]} />
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Database size={17} className="text-blue-400" /> Data Freshness
            </span>
          </SectionTitle>
          <div className="space-y-5">
            <div>
              <div className="text-xs text-slate-400">Last sync</div>
              <div className="mt-1 text-lg font-bold text-white">{lastUpdated}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Source</div>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-base font-semibold text-white">{dataSource}</span>
                <Badge tone="positive">Live-ready</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Clock size={16} className="text-slate-400" /> Next local check in 15 mins
            </div>
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Trophy size={17} className="text-amber-300" /> Top Opportunity
            </span>
          </SectionTitle>
          <div className="flex gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-[8px] bg-gradient-to-br from-orange-500 to-red-600 text-lg font-black text-white">{topStock.symbol.slice(0, 4)}</div>
            <div className="min-w-0 flex-1">
              <div className="text-xl font-black text-white">{topStock.symbol}</div>
              <div className="truncate text-sm text-slate-300">{topStock.company}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-3xl font-black text-emerald-400">{topStock.opportunityScore}</span>
                <span className="text-sm text-slate-400">/100</span>
                <Badge tone="positive">{topStock.label}</Badge>
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-700/60 py-3 text-sm">
            <div>
              <div className="text-slate-400">Dividend score</div>
              <div className="font-bold text-white">{topStock.dividendScore}/100</div>
            </div>
            <div>
              <div className="text-slate-400">Sector</div>
              <div className="font-bold text-white">{topStock.sector}</div>
            </div>
          </div>
          <p className="mt-3 text-sm leading-5 text-slate-300">{topStock.reason}</p>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle>
            <span className="inline-flex items-center gap-2 text-red-300">
              <ShieldAlert size={17} /> Risk Alerts
            </span>
          </SectionTitle>
          <div className="space-y-2">
            {alerts.map((alert) => (
              <a key={alert.title} href="/alerts" className="soft-panel flex items-center justify-between gap-3 rounded-[8px] p-3 transition hover:bg-slate-800/60">
                <span className="flex min-w-0 items-center gap-3 text-sm font-semibold text-slate-100">
                  {alert.severity === "danger" ? <Flame className="text-red-400" size={18} /> : alert.severity === "warning" ? <AlertTriangle className="text-amber-300" size={18} /> : <Bell className="text-indigo-300" size={18} />}
                  <span className="truncate">{alert.title}</span>
                </span>
                <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-bold text-white">{alert.count}</span>
              </a>
            ))}
          </div>
          <a href="/alerts" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-red-300">
            Review alerts <ArrowRight size={16} />
          </a>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5">
          <SectionTitle action={<button className="rounded-md border border-slate-700 px-3 py-1 text-xs text-slate-300">Today</button>}>
            <span className="inline-flex items-center gap-2">Sector Heatmap <Info size={14} className="text-slate-400" /></span>
          </SectionTitle>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {sectors.map((sector) => (
              <button
                key={sector.name}
                onClick={() => setSelectedSector(sector.name)}
                className={`rounded-[8px] border p-3 text-left transition ${selectedSector === sector.name ? "border-emerald-400/70 bg-emerald-500/16" : "border-slate-700/65 bg-slate-950/25 hover:bg-slate-800/60"}`}
              >
                <div className="text-sm font-bold text-white">{sector.name}</div>
                <div className={`mt-2 text-lg font-black ${sector.change >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {sector.change > 0 ? "+" : ""}
                  {sector.change.toFixed(2)}%
                </div>
                <div className="mt-2 text-xs text-slate-300">Score: {sector.score}</div>
                <div className="mt-1 text-[11px] text-slate-500">Best: {sector.bestStock}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-4">
          <SectionTitle action={<a href="/dividend-radar" className="text-xs font-bold text-blue-300">View all</a>}>Dividend Leaders</SectionTitle>
          <div className="overflow-x-auto thin-scrollbar">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] uppercase text-slate-500">
                <tr>
                  <th className="py-2">#</th>
                  <th>Stock</th>
                  <th>Yield</th>
                  <th>Score</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {stocks.slice(0, 5).map((stock, index) => (
                  <tr key={stock.symbol} className="hover:bg-slate-900/60">
                    <td className="py-3 text-slate-400">{index + 1}</td>
                    <td>
                      <div className="font-bold text-white">{stock.symbol}</div>
                      <div className="text-xs text-slate-500">{stock.company}</div>
                    </td>
                    <td className="font-semibold text-slate-200">{stock.dividendYield.toFixed(2)}%</td>
                    <td className="font-bold text-emerald-400">{stock.dividendScore}</td>
                    <td>
                      <button onClick={() => toggleWatchlist(stock.symbol)} className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-200 hover:border-blue-400/70">
                        <Star size={13} className={watchlisted.has(stock.symbol) ? "fill-amber-300 text-amber-300" : ""} />
                        Watchlist
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <a href="/dividend-radar" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            View full leaderboard <ArrowRight size={16} />
          </a>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Opportunity Score Distribution</SectionTitle>
          <BarDistribution data={scoreDistribution} />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-red-300">Low Opportunity</span>
            <span className="text-emerald-300">High Opportunity</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-4">
          <SectionTitle action={<a href="/reports" className="text-xs font-bold text-blue-300">View all</a>}>What Changed Since Last Scan</SectionTitle>
          <div className="space-y-3">
            {changedItems.map((item) => (
              <div key={item.symbol} className="flex items-center gap-3">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${item.change > 0 ? "bg-emerald-500/20 text-emerald-300" : item.change < 0 ? "bg-red-500/20 text-red-300" : "bg-amber-500/20 text-amber-300"}`}>
                  {item.change > 0 ? "↑" : item.change < 0 ? "↓" : "–"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{item.symbol}</div>
                  <div className="truncate text-xs text-slate-400">{item.detail}</div>
                </div>
                <div className={`text-sm font-bold ${item.change > 0 ? "text-emerald-400" : item.change < 0 ? "text-red-400" : "text-amber-300"}`}>
                  {item.change > 0 ? "+" : ""}
                  {item.change.toFixed(2)}%
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle action={<a href="/watchlist" className="text-xs font-bold text-blue-300">View all</a>}>Watchlist Movement</SectionTitle>
          <div className="space-y-3">
            {watchlist.slice(0, 5).map((item) => {
              const stock = stocks.find((candidate) => candidate.symbol === item.symbol)!;
              return (
                <div key={item.symbol} className="grid grid-cols-[72px_1fr_90px] items-center gap-2 text-sm">
                  <span className="font-bold text-white">{item.symbol}</span>
                  <span className="text-slate-300">{formatNaira(stock.price)}</span>
                  <Sparkline values={stock.trend} stroke={item.movement >= 0 ? "#22C55E" : "#EF4444"} className="h-7" />
                </div>
              );
            })}
          </div>
          <a href="/watchlist" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            Manage Watchlist <ArrowRight size={16} />
          </a>
        </Card>

        <Card className="xl:col-span-3">
          <SectionTitle>Portfolio Allocation</SectionTitle>
          <DonutChart
            slices={[
              { label: "Banking", value: 48.2, color: "#3B82F6" },
              { label: "Telecom/ICT", value: 25.8, color: "#10B981" },
              { label: "Consumer Goods", value: 17.3, color: "#EAB308" },
              { label: "Others", value: 8.7, color: "#64748B" },
            ]}
          />
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4">
            <Metric label="Invested" value={formatCompactNaira(portfolio.invested)} />
            <Metric label="Gain/Loss" value={`${portfolio.gainPercent.toFixed(1)}%`} tone={portfolio.gain >= 0 ? "positive" : "danger"} />
          </div>
          <a href="/portfolio" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-300">
            View Portfolio <ArrowRight size={16} />
          </a>
        </Card>

        <Card className="xl:col-span-2">
          <SectionTitle>
            <span className="inline-flex items-center gap-2">
              <Sparkles size={17} className="text-violet-300" /> AI Briefing
            </span>
          </SectionTitle>
          <p className="text-sm leading-6 text-slate-300">{aiBriefing}</p>
          <a href="/assistant" className="mt-5 inline-flex items-center gap-2 rounded-[8px] bg-indigo-600 px-4 py-2 text-sm font-bold text-white">
            Ask follow-up <Plus size={16} />
          </a>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {holdings.map((holding) => {
          const stock = stocks.find((item) => item.symbol === holding.symbol)!;
          return (
            <Card key={holding.id} className="flex items-center gap-4">
              <ScoreRing score={stock.opportunityScore} />
              <div className="min-w-0">
                <div className="text-sm text-slate-400">{holding.tag}</div>
                <div className="text-lg font-black text-white">{holding.symbol}</div>
                <div className="mt-1 flex flex-wrap gap-2">
                  <ScoreBadge score={stock.dividendScore} />
                  <Badge tone={holding.riskLevel === "Low" ? "positive" : "warning"}>{holding.riskLevel} risk</Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
