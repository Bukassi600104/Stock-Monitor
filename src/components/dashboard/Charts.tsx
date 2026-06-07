import { clsx } from "clsx";

export function Sparkline({
  values,
  stroke = "#22C55E",
  fill = "rgba(34, 197, 94, 0.16)",
  className,
}: {
  values: number[];
  stroke?: string;
  fill?: string;
  className?: string;
}) {
  const width = 220;
  const height = 70;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * width;
    const y = height - ((value - min) / Math.max(max - min, 1)) * (height - 10) - 5;
    return `${x},${y}`;
  });
  const area = `0,${height} ${points.join(" ")} ${width},${height}`;

  return (
    <svg className={clsx("h-[70px] w-full overflow-visible", className)} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} />
          <stop offset="100%" stopColor="rgba(34, 197, 94, 0)" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline points={points.join(" ")} fill="none" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
    </svg>
  );
}

export function BarDistribution({ data }: { data: { range: string; count: number; color: string }[] }) {
  const max = Math.max(...data.map((item) => item.count));
  return (
    <div className="flex h-44 items-end gap-4 border-b border-slate-700/70 px-2 pt-4">
      {data.map((item) => (
        <div key={item.range} className="flex min-w-0 flex-1 flex-col items-center gap-2">
          <div className="text-xs font-bold text-slate-100">{item.count}</div>
          <div
            className="w-full rounded-t-[6px] shadow-[0_0_22px_rgba(34,197,94,0.18)]"
            style={{ height: `${Math.max(12, (item.count / max) * 120)}px`, background: `linear-gradient(180deg, ${item.color}, ${item.color}99)` }}
          />
          <div className="text-[11px] text-slate-300">{item.range}</div>
        </div>
      ))}
    </div>
  );
}

export function DonutChart({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  let start = 0;
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const gradient = slices
    .map((slice) => {
      const end = start + (slice.value / total) * 100;
      const segment = `${slice.color} ${start}% ${end}%`;
      start = end;
      return segment;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-5">
      <div className="grid h-36 w-36 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${gradient})` }}>
        <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-[#0b1424] text-center shadow-inner">
          <span className="text-lg font-bold text-white">₦4.0M</span>
          <span className="-mt-2 block text-[10px] text-slate-400">Total value</span>
        </div>
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {slices.map((slice) => (
          <div key={slice.label} className="flex items-center justify-between gap-3 text-[12px]">
            <span className="flex items-center gap-2 text-slate-300">
              <span className="h-2 w-2 rounded-full" style={{ background: slice.color }} />
              {slice.label}
            </span>
            <span className="font-semibold text-slate-100">{slice.value.toFixed(1)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ScoreRing({ score }: { score: number }) {
  const angle = (score / 100) * 360;
  return (
    <div
      className="grid h-20 w-20 shrink-0 place-items-center rounded-full"
      style={{ background: `conic-gradient(#22C55E ${angle}deg, rgba(148,163,184,.18) 0)` }}
    >
      <div className="grid h-[58px] w-[58px] place-items-center rounded-full bg-[#0b1424]">
        <span className="text-xl font-black text-emerald-300">{score}</span>
      </div>
    </div>
  );
}
