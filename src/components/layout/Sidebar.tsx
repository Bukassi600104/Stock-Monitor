"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  FileBarChart,
  Grid2X2,
  Home,
  Import,
  LineChart,
  Radar,
  Search,
  Settings,
  Sparkles,
  Star,
  Table2,
  Target,
} from "lucide-react";
import { clsx } from "clsx";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/market", label: "Market Scanner", icon: Search },
  { href: "/sectors", label: "Sector Map", icon: Grid2X2 },
  { href: "/screener", label: "Stock Screener", icon: Table2 },
  { href: "/dividend-radar", label: "Dividend Radar", icon: Radar },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/portfolio", label: "Portfolio", icon: BriefcaseBusiness },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/assistant", label: "AI Assistant", icon: Sparkles },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/imports", label: "Import Data", icon: Import },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden h-screen w-[250px] shrink-0 border-r border-slate-700/60 bg-[#07101d]/95 px-3 py-5 lg:sticky lg:top-0 lg:block">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3 px-2">
        <div className="grid h-12 w-12 place-items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 text-emerald-300 shadow-[0_0_22px_rgba(34,197,94,.18)]">
          <Target size={27} />
        </div>
        <div>
          <div className="text-2xl font-black leading-6 text-white">NGX</div>
          <div className="text-sm font-bold text-emerald-400">Dividend Radar</div>
        </div>
      </Link>

      <nav className="space-y-1.5">
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex h-12 items-center gap-4 rounded-[8px] px-4 text-sm font-medium text-slate-300 transition",
                active
                  ? "border border-emerald-400/35 bg-emerald-500/15 text-white shadow-[inset_3px_0_0_#22C55E]"
                  : "hover:bg-slate-800/70 hover:text-white",
              )}
            >
              <Icon size={20} className={active ? "text-emerald-300" : "text-slate-400"} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-6 left-3 right-3 rounded-[8px] border border-slate-700/55 bg-slate-900/80 p-3">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-200">TO</div>
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-white">Tony Orjiako</div>
            <div className="text-xs text-emerald-300">Local-first plan</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
