"use client";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMemo } from "react";
import { makeKFormatter } from "@/lib/utils";

export default function NetWorthTimeline() {
  const { profile, investments } = useStore();
  const { format, convertAmount, currency, symbol } = useCurrency();

  const data = useMemo(() => {
    const monthlyExpenses =
      profile.monthlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) +
      profile.yearlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) / 12;

    const monthlyNet = convertAmount(profile.monthlyIncome, profile.monthlyIncomeCurrency ?? "USD", currency) - monthlyExpenses;
    const totalInvested = investments.reduce(
      (s, inv) => s + inv.entries.reduce((es, e) => es + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0),
      0
    );

    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const now = new Date();

    return Array.from({ length: 12 }, (_, i) => {
      const monthIdx = (now.getMonth() + i) % 12;
      const savings = Math.max(0, monthlyNet * (i + 1));
      return {
        month: months[monthIdx],
        savings: Math.round(savings),
        invested: Math.round(totalInvested),
        total: Math.round(savings + totalInvested),
      };
    });
  }, [profile, investments, convertAmount, currency]);

  const hasData = profile.monthlyIncome > 0 || investments.length > 0;

  if (!hasData) {
    return (
      <Card>
        <h3 className="text-sm font-medium text-slate-400 mb-4">12-Month Net Worth Projection</h3>
        <p className="text-slate-500 text-sm text-center py-10">
          Add income and investments to see your net worth projection.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-slate-400">12-Month Net Worth Projection</h3>
        <span className="text-xs text-slate-500">Total: {format(data[data.length - 1]?.total ?? 0)}</span>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis tickFormatter={makeKFormatter(symbol)} tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            formatter={(v) => [format(Number(v)), ""]}
          />
          <Area
            type="monotone"
            dataKey="total"
            name="Projected Net Worth"
            stroke="#10b981"
            fill="url(#gradTotal)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
