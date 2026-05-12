"use client";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { Card, CardTitle, CardValue } from "@/components/ui/Card";
import { TrendingUp, TrendingDown, DollarSign, PiggyBank } from "lucide-react";

export default function SummaryCards() {
  const { profile, investments } = useStore();
  const { format, convertAmount, currency } = useCurrency();

  const monthlyExpenses =
    profile.monthlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) +
    profile.yearlyCosts.reduce((s, c) => s + convertAmount(c.amount, c.amountCurrency ?? "USD", currency), 0) / 12;

  const monthlyIncomeDisplay = convertAmount(profile.monthlyIncome, profile.monthlyIncomeCurrency ?? "USD", currency);
  const yearlyBonusDisplay = convertAmount(profile.yearlyBonusIncome, profile.yearlyBonusIncomeCurrency ?? "USD", currency);
  const monthlyNet = monthlyIncomeDisplay - monthlyExpenses;
  const yearlyNet = monthlyNet * 12 + yearlyBonusDisplay;

  const totalInvested = investments.reduce(
    (s, inv) => s + inv.entries.reduce((es, e) => es + convertAmount(e.totalCost, e.pricePerUnitCurrency ?? "USD", currency), 0),
    0
  );

  const savingsRate = monthlyIncomeDisplay > 0
    ? ((monthlyNet / monthlyIncomeDisplay) * 100).toFixed(1)
    : "0";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Monthly Income</CardTitle>
            <CardValue>{format(monthlyIncomeDisplay)}</CardValue>
          </div>
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          +{format(yearlyBonusDisplay)} yearly bonus
        </p>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Monthly Expenses</CardTitle>
            <CardValue className="text-red-400">{format(monthlyExpenses)}</CardValue>
          </div>
          <div className="p-2 bg-red-500/10 rounded-lg">
            <TrendingDown size={18} className="text-red-400" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {profile.monthlyCosts.length + profile.yearlyCosts.length} cost items
        </p>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Monthly Net</CardTitle>
            <CardValue className={monthlyNet >= 0 ? "text-emerald-400" : "text-red-400"}>
              {format(monthlyNet)}
            </CardValue>
          </div>
          <div className={`p-2 rounded-lg ${monthlyNet >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
            <TrendingUp size={18} className={monthlyNet >= 0 ? "text-emerald-400" : "text-red-400"} />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Savings rate: {savingsRate}% · {format(yearlyNet)}/yr
        </p>
      </Card>

      <Card>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Total Invested</CardTitle>
            <CardValue className="text-blue-400">{format(totalInvested)}</CardValue>
          </div>
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <PiggyBank size={18} className="text-blue-400" />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          {investments.length} investment{investments.length !== 1 ? "s" : ""}
        </p>
      </Card>
    </div>
  );
}
