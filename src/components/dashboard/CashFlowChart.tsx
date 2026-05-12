"use client";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { Card } from "@/components/ui/Card";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

export default function CashFlowChart() {
  const { profile } = useStore();
  const { format, convertAmount, currency } = useCurrency();

  // Build expense breakdown in display currency
  const expensesByCategory: Record<string, number> = {};
  [
    ...profile.monthlyCosts.map((c) => ({ ...c, _converted: convertAmount(c.amount, c.amountCurrency ?? "USD", currency) })),
    ...profile.yearlyCosts.map((c) => ({ ...c, _converted: convertAmount(c.amount, c.amountCurrency ?? "USD", currency) / 12 })),
  ].forEach((c) => {
    const key = c.category || "Other";
    expensesByCategory[key] = (expensesByCategory[key] || 0) + c._converted;
  });

  const totalExpenses = Object.values(expensesByCategory).reduce((a, b) => a + b, 0);
  const savings = Math.max(0, convertAmount(profile.monthlyIncome, profile.monthlyIncomeCurrency ?? "USD", currency) - totalExpenses);

  const data = [
    ...Object.entries(expensesByCategory).map(([name, value]) => ({ name, value: parseFloat(value.toFixed(2)) })),
    ...(savings > 0 ? [{ name: "Savings", value: parseFloat(savings.toFixed(2)) }] : []),
  ];

  if (data.length === 0) {
    return (
      <Card>
        <h3 className="text-sm font-medium text-slate-400 mb-4">Monthly Cash Flow</h3>
        <p className="text-slate-500 text-sm text-center py-10">No data yet. Add income and expenses.</p>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-sm font-medium text-slate-400 mb-4">Monthly Cash Flow Breakdown</h3>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v) => [format(Number(v)), ""]}
          />
          <Legend
            formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
