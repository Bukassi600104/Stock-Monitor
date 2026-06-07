"use client";

import { useEffect, useState } from "react";
import { Menu, Target } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { CommandCenter } from "./CommandCenter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen lg:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between border-b border-slate-700/60 bg-[#07101d]/95 px-4 py-3 lg:hidden">
          <a href="/dashboard" className="flex items-center gap-3 text-white">
            <div className="grid h-10 w-10 place-items-center rounded-full border border-emerald-400/45 bg-emerald-500/10 text-emerald-300">
              <Target size={22} />
            </div>
            <div>
              <div className="text-lg font-black leading-5">NGX</div>
              <div className="text-xs font-bold text-emerald-400">Dividend Radar</div>
            </div>
          </a>
          <button onClick={() => setCommandOpen(true)} className="grid h-10 w-10 place-items-center rounded-[8px] border border-slate-700 text-slate-300" aria-label="Open menu">
            <Menu size={20} />
          </button>
        </div>
        <TopBar onOpenCommand={() => setCommandOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 py-4 sm:px-5 lg:px-6">{children}</main>
      </div>
      <CommandCenter open={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  );
}
