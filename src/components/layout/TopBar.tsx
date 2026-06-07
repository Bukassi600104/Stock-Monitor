"use client";

import { useMemo, useState } from "react";
import { Bell, Command, Moon, RefreshCcw, Search, Sparkles, Sun } from "lucide-react";
import { stocks } from "@/lib/data";

export function TopBar({ onOpenCommand }: { onOpenCommand: () => void }) {
  const [refreshing, setRefreshing] = useState(false);
  const [query, setQuery] = useState("");
  const matches = useMemo(() => {
    if (!query.trim()) return [];
    const normalized = query.toLowerCase();
    return stocks.filter((stock) => `${stock.symbol} ${stock.company}`.toLowerCase().includes(normalized)).slice(0, 4);
  }, [query]);

  function refresh() {
    setRefreshing(true);
    window.setTimeout(() => setRefreshing(false), 1200);
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-700/45 bg-[#08111f]/88 px-4 py-3 backdrop-blur-xl">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stocks (e.g. GTCO, MTNN, UBA...)"
            className="h-11 w-full rounded-[8px] border border-slate-600/60 bg-slate-950/35 pl-12 pr-20 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-blue-400/70"
          />
          <button
            onClick={onOpenCommand}
            className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-slate-600/60 bg-slate-900 px-2 py-1 text-xs text-slate-300"
            aria-label="Open command palette"
          >
            <Command size={13} /> K
          </button>
          {matches.length > 0 && (
            <div className="absolute left-0 right-0 top-12 z-40 rounded-[8px] border border-slate-700 bg-[#0b1424] p-2 shadow-2xl">
              {matches.map((stock) => (
                <a key={stock.symbol} href={`/stocks/${stock.symbol}`} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-slate-800">
                  <span className="font-semibold text-white">{stock.symbol}</span>
                  <span className="truncate text-slate-400">{stock.company}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={refresh}
            className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-emerald-500/70 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-300 transition hover:bg-emerald-500/18"
          >
            <RefreshCcw size={17} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh Market Data"}
          </button>
          <div className="hidden text-xs text-slate-400 md:block">Last updated: June 7, 2026 21:45 WAT</div>
          <div className="rounded-[8px] border border-slate-700 bg-slate-950/35 px-3 py-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Fresh
            </div>
            <div className="text-xs text-slate-300">Local data connected</div>
          </div>
          <a href="/assistant" className="inline-flex h-11 items-center gap-2 rounded-[8px] bg-indigo-600 px-4 text-sm font-bold text-white shadow-[0_0_24px_rgba(99,102,241,.35)]">
            <Sparkles size={17} /> Ask AI
          </a>
          <button className="grid h-11 w-11 place-items-center rounded-full border border-slate-700 bg-slate-900 text-slate-300" aria-label="Notifications">
            <Bell size={18} />
          </button>
          <button className="flex h-11 items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 text-slate-300" aria-label="Theme toggle">
            <Sun size={16} />
            <Moon size={16} className="text-slate-100" />
          </button>
        </div>
      </div>
    </header>
  );
}
