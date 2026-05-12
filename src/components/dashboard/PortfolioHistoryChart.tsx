"use client";
import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { Card } from "@/components/ui/Card";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { makeKFormatter } from "@/lib/utils";
import { Camera } from "lucide-react";

type DateFilter = "1W" | "1M" | "3M" | "6M" | "1Y" | "All";

const DATE_FILTERS: DateFilter[] = ["1W", "1M", "3M", "6M", "1Y", "All"];

function filterCutoff(filter: DateFilter): string {
  const now = new Date();
  const days: Record<string, number> = { "1W": 7, "1M": 30, "3M": 90, "6M": 180, "1Y": 365 };
  if (filter === "All") return "1970-01-01";
  now.setDate(now.getDate() - days[filter]);
  return now.toISOString().slice(0, 10);
}

export default function PortfolioHistoryChart() {
  const { snapshots, investments, addSnapshot } = useStore();
  const { format, fromUSD, symbol } = useCurrency();
  const [filter, setFilter] = useState<DateFilter>("3M");

  const symbols = investments.map((i) => i.symbol);
  const { prices } = useMarketPrices(symbols);

  // Current portfolio value in USD
  const currentValueUsd = investments.reduce((sum, inv) => {
    const qty = inv.entries.reduce((s, e) => s + e.quantity, 0);
    const price = prices[inv.symbol]?.price ?? 0;
    return sum + qty * price;
  }, 0);

  const today = new Date().toISOString().slice(0, 10);
  const cutoff = filterCutoff(filter);

  const { chartData, hasProjection } = useMemo(() => {
    const filtered = snapshots.filter((s) => s.snapshotDate >= cutoff);

    // Build historical points from snapshots
    const historical: { date: string; value: number; projected: number | undefined }[] = filtered.map((s) => ({
      date: s.snapshotDate,
      value: Math.round(fromUSD(s.totalValueUsd)),
      projected: undefined,
    }));

    // Add current live value as today's point if we have prices
    if (currentValueUsd > 0 && (historical.length === 0 || historical[historical.length - 1]?.date !== today)) {
      historical.push({ date: today, value: Math.round(fromUSD(currentValueUsd)), projected: undefined });
    }

    if (historical.length === 0) return { chartData: [], hasProjection: false };

    // Projection: use last 2 points to get rate, project 30 days
    const PROJECTION_DAYS = 30;
    let avgDailyPct = 0;
    if (historical.length >= 2) {
      const last = historical[historical.length - 1];
      const prev = historical[historical.length - 2];
      const daysDiff = Math.max(1, (new Date(last.date).getTime() - new Date(prev.date).getTime()) / 86400000);
      avgDailyPct = prev.value > 0 ? ((last.value - prev.value) / prev.value) / daysDiff : 0;
    }

    const projectionPoints: { date: string; value: undefined; projected: number }[] = [];
    const lastPt = historical[historical.length - 1];
    let projVal = lastPt.value;
    const base = new Date(lastPt.date);
    for (let d = 1; d <= PROJECTION_DAYS; d++) {
      const nd = new Date(base);
      nd.setDate(base.getDate() + d);
      if (nd.getDay() === 0 || nd.getDay() === 6) continue;
      projVal = Math.round(projVal * (1 + avgDailyPct));
      projectionPoints.push({ date: nd.toISOString().slice(0, 10), value: undefined, projected: projVal });
    }

    // Merge with continuity at junction
    const junction = { ...lastPt, projected: lastPt.value };
    const merged = [...historical.slice(0, -1), junction, ...projectionPoints];

    return { chartData: merged, hasProjection: projectionPoints.length > 0 };
  }, [snapshots, cutoff, currentValueUsd, fromUSD, today]);

  const handleSnapshot = () => {
    const valueBySymbol: Record<string, { qty: number; priceUsd: number; valueUsd: number }> = {};
    let totalValueUsd = 0;
    for (const inv of investments) {
      const qty = inv.entries.reduce((s, e) => s + e.quantity, 0);
      const priceUsd = prices[inv.symbol]?.price ?? 0;
      const valueUsd = priceUsd * qty;
      totalValueUsd += valueUsd;
      if (qty > 0) valueBySymbol[inv.symbol] = { qty, priceUsd, valueUsd };
    }
    addSnapshot({ snapshotDate: today, totalValueUsd, valueBySymbol });
  };

  if (investments.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-medium text-slate-400 mb-2">Portfolio History</h3>
        <p className="text-slate-500 text-sm text-center py-10">Add investments to track your portfolio history.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-slate-400">Portfolio History</h3>
          {snapshots.length === 0 && (
            <p className="text-xs text-slate-500 mt-0.5">Take your first snapshot to start tracking history</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {DATE_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  filter === f ? "bg-emerald-500/20 text-emerald-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={handleSnapshot}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
            title="Save current portfolio value as a snapshot"
          >
            <Camera size={12} />
            Snapshot
          </button>
        </div>
      </div>

      {chartData.length <= 1 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <p className="text-slate-500 text-sm">Current value: <span className="text-white font-semibold">{format(fromUSD(currentValueUsd))}</span></p>
          <p className="text-xs text-slate-600">Take snapshots over time to see your history chart</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradSnap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} interval="preserveStartEnd" tickFormatter={(d) => d.slice(5)} />
            <YAxis tickFormatter={makeKFormatter(symbol)} tick={{ fill: "#64748b", fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
              formatter={(v, name) => [format(Number(v)), name === "projected" ? "Projected" : "Portfolio Value"]}
              labelFormatter={(l) => l}
            />
            <ReferenceLine x={today} stroke="#f59e0b" strokeDasharray="4 3" label={{ value: "Today", fill: "#f59e0b", fontSize: 11, position: "top" }} />
            <Area type="monotone" dataKey="value" name="value" stroke="#10b981" fill="url(#gradSnap)" strokeWidth={2} dot={{ fill: "#10b981", r: 3 }} connectNulls={false} />
            {hasProjection && (
              <Line type="monotone" dataKey="projected" name="projected" stroke="#3b82f6" strokeWidth={2} strokeDasharray="6 3" dot={false} connectNulls={false} />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
