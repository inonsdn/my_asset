"use client";
import { useStore } from "@/lib/store";
import { formatPercent } from "@/lib/utils";
import { useCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import { useMarketPrices } from "@/hooks/useMarketPrices";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";

export default function InvestmentSummary() {
  const { investments } = useStore();
  const symbols = investments.map((i) => i.symbol);
  const { prices, loading } = useMarketPrices(symbols);
  const { format, fromUSD, convertAmount, currency } = useCurrency();

  if (investments.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-medium text-slate-400 mb-4">Investments</h3>
        <p className="text-slate-500 text-sm text-center py-6">No investments yet. Add your first investment.</p>
      </Card>
    );
  }

  const rows = investments.map((inv) => {
    const totalCostDisplay = inv.entries.reduce((s, e) => s + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0);
    const totalQty = inv.entries.reduce((s, e) => s + e.quantity, 0);
    // Market prices from Yahoo Finance come in USD — convert to display currency
    const currentPriceUSD = prices[inv.symbol]?.price;
    const currentValue = currentPriceUSD ? fromUSD(currentPriceUSD * totalQty) : null;
    const pnl = currentValue !== null ? currentValue - totalCostDisplay : null;
    const pnlPct = pnl !== null && totalCostDisplay > 0 ? (pnl / totalCostDisplay) * 100 : null;
    return { inv, totalCostDisplay, totalQty, currentPriceUSD, currentValue, pnl, pnlPct };
  });

  const totalCost = rows.reduce((s, r) => s + r.totalCostDisplay, 0);
  const totalValue = rows.reduce((s, r) => s + (r.currentValue ?? r.totalCostDisplay), 0);
  const totalPnl = totalValue - totalCost;
  const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">Investment Portfolio</h3>
        {loading && <Loader2 size={14} className="text-slate-500 animate-spin" />}
      </div>

      <div className="flex gap-6 mb-4 pb-4 border-b border-slate-700">
        <div>
          <p className="text-xs text-slate-500">Total Cost</p>
          <p className="font-semibold">{format(totalCost)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Current Value</p>
          <p className="font-semibold text-blue-400">{format(totalValue)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Total P&L</p>
          <p className={`font-semibold ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
            {format(totalPnl)} ({formatPercent(totalPnlPct)})
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map(({ inv, totalCostDisplay, currentValue, pnl, pnlPct, currentPriceUSD }) => (
          <div key={inv.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                {inv.symbol.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{inv.symbol}</p>
                <p className="text-xs text-slate-500">{inv.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{format(currentValue ?? totalCostDisplay)}</p>
              {pnl !== null && (
                <p className={`text-xs flex items-center gap-1 justify-end ${pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {pnl >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatPercent(pnlPct!)}
                </p>
              )}
              {currentPriceUSD && (
                <p className="text-xs text-slate-500">
                  {format(fromUSD(currentPriceUSD))}/unit
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
