import { clsx } from "clsx";
import type { ReactNode } from "react";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={clsx("dashboard-card rounded-[8px] p-4", className)}>{children}</section>;
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h2 className="text-[13px] font-bold uppercase tracking-normal text-slate-100">{children}</h2>
      {action}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "positive" | "warning" | "danger" | "primary";
}) {
  const tones = {
    neutral: "border-slate-600/40 bg-slate-700/35 text-slate-200",
    positive: "border-emerald-500/30 bg-emerald-500/15 text-emerald-300",
    warning: "border-amber-500/30 bg-amber-500/15 text-amber-200",
    danger: "border-red-500/30 bg-red-500/15 text-red-300",
    primary: "border-blue-500/30 bg-blue-500/15 text-blue-200",
  };

  return <span className={clsx("inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold", tones[tone])}>{children}</span>;
}

export function Metric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "positive" | "warning" | "danger";
}) {
  const toneClass = {
    neutral: "text-slate-100",
    positive: "text-emerald-400",
    warning: "text-amber-300",
    danger: "text-red-400",
  }[tone];

  return (
    <div className="min-w-0">
      <div className={clsx("text-lg font-bold", toneClass)}>{value}</div>
      <div className="mt-1 text-[11px] text-slate-400">{label}</div>
    </div>
  );
}

export function ScoreBadge({ score }: { score: number }) {
  const tone = score >= 80 ? "positive" : score >= 60 ? "primary" : score >= 40 ? "warning" : "danger";
  return <Badge tone={tone}>{score}/100</Badge>;
}
