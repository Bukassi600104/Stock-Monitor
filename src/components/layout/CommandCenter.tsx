"use client";

import { useEffect, useState } from "react";
import { FileUp, MessageSquare, RefreshCcw, Search, Star, X } from "lucide-react";

const commands = [
  { label: "Search stock", href: "/market", icon: Search },
  { label: "Compare stocks", href: "/screener", icon: Search },
  { label: "Add to watchlist", href: "/watchlist", icon: Star },
  { label: "Refresh data", href: "/imports", icon: RefreshCcw },
  { label: "Generate briefing", href: "/reports", icon: MessageSquare },
  { label: "Open portfolio", href: "/portfolio", icon: FileUp },
  { label: "Import CSV", href: "/imports", icon: FileUp },
  { label: "Ask AI about market", href: "/assistant", icon: MessageSquare },
];

export function CommandCenter({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [filter, setFilter] = useState("");

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  const visible = commands.filter((command) => command.label.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/55 px-4 pt-24 backdrop-blur-sm" onClick={onClose}>
      <div className="mx-auto w-full max-w-xl rounded-[8px] border border-slate-700 bg-[#0b1424] shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center gap-3 border-b border-slate-700/70 p-4">
          <Search size={19} className="text-slate-400" />
          <input
            autoFocus
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Type a command..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          />
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-md hover:bg-slate-800" aria-label="Close command center">
            <X size={17} />
          </button>
        </div>
        <div className="p-2">
          {visible.map((command) => {
            const Icon = command.icon;
            return (
              <a key={command.label} href={command.href} className="flex items-center gap-3 rounded-md px-3 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">
                <Icon size={18} className="text-blue-300" />
                {command.label}
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}
