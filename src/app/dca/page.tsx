"use client";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useCurrency } from "@/lib/currency";
import { makeKFormatter } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import Select from "@/components/ui/Select";
import Modal from "@/components/ui/Modal";
import MoneyInput from "@/components/ui/MoneyInput";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { v4 as uuid } from "@/lib/uuid";
import type { DCAConfig } from "@/lib/types";
import { format as dateFmt } from "date-fns";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const TYPE_OPTIONS = [
  { value: "stock", label: "Stock" },
  { value: "etf", label: "ETF" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "other", label: "Other" },
];

function buildDCAProjection(cfg: DCAConfig) {
  const months = cfg.years * 12;
  const monthlyRate = cfg.expectedAnnualReturn / 100 / 12;
  const data: { label: string; invested: number; value: number; gain: number }[] = [];
  let totalInvested = 0;
  let portfolioValue = 0;

  for (let m = 1; m <= months; m++) {
    portfolioValue = (portfolioValue + cfg.monthlyAmount) * (1 + monthlyRate);
    totalInvested += cfg.monthlyAmount;
    if (m % 12 === 0 || m === months) {
      data.push({
        label: `Yr ${m / 12 <= 1 ? 1 : Math.ceil(m / 12)}`,
        invested: Math.round(totalInvested),
        value: Math.round(portfolioValue),
        gain: Math.round(portfolioValue - totalInvested),
      });
    }
  }
  return { data, totalInvested, finalValue: portfolioValue, totalGain: portfolioValue - totalInvested };
}

function DCACard({ cfg }: { cfg: DCAConfig }) {
  const { removeDCAConfig } = useStore();
  const { format, convertAmount, currency, symbol } = useCurrency();
  const monthlyInvestment = convertAmount(cfg.monthlyAmount, cfg.monthlyAmountCurrency ?? "USD", currency);
  const cfgDisplay: DCAConfig = { ...cfg, monthlyAmount: monthlyInvestment };
  const { data, totalInvested, finalValue, totalGain } = buildDCAProjection(cfgDisplay);
  const totalReturn = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

  return (
    <Card>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{cfg.symbol}</h3>
            <span className="text-xs bg-slate-700 px-2 py-0.5 rounded capitalize">{cfg.type}</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{cfg.name}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => removeDCAConfig(cfg.id)}>
          <Trash2 size={14} className="text-red-400" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div>
          <p className="text-xs text-slate-500">Monthly</p>
          <p className="font-semibold">{format(monthlyInvestment)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Expected Return</p>
          <p className="font-semibold text-emerald-400">{cfg.expectedAnnualReturn}%/yr</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Duration</p>
          <p className="font-semibold">{cfg.years} years</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Starting</p>
          <p className="font-semibold text-sm">{cfg.startDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-700/50 rounded-xl">
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Total Invested</p>
          <p className="font-bold text-sm">{format(totalInvested)}</p>
        </div>
        <div className="text-center border-x border-slate-600">
          <p className="text-xs text-slate-400 mb-1">Final Value</p>
          <p className="font-bold text-emerald-400 text-sm">{format(finalValue)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 mb-1">Total Gain</p>
          <p className="font-bold text-blue-400 text-sm">
            {format(totalGain)} (+{totalReturn.toFixed(0)}%)
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`gradInv-${cfg.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id={`gradVal-${cfg.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 11 }} />
          <YAxis tickFormatter={makeKFormatter(symbol)} tick={{ fill: "#64748b", fontSize: 11 }} />
          <Tooltip
            contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8 }}
            formatter={(v) => [format(Number(v)), ""]}
          />
          <Legend formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{v}</span>} />
          <Area type="monotone" dataKey="invested" name="Total Invested" stroke="#3b82f6" fill={`url(#gradInv-${cfg.id})`} strokeWidth={2} />
          <Area type="monotone" dataKey="value" name="Portfolio Value" stroke="#10b981" fill={`url(#gradVal-${cfg.id})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

function AddDCAModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addDCAConfig } = useStore();
  const { format, currency: currencyCode } = useCurrency();
  const [symbol, setSymbol] = useState("SPY");
  const [name, setName] = useState("S&P 500 ETF");
  const [type, setType] = useState("etf");
  const [monthly, setMonthly] = useState("500");
  const [monthlyCurr, setMonthlyCurr] = useState<string>(currencyCode);
  const [annualReturn, setAnnualReturn] = useState("10");
  const [years, setYears] = useState("20");
  const [startDate, setStartDate] = useState(dateFmt(new Date(), "yyyy-MM-dd"));

  const handleAdd = () => {
    if (!symbol || !monthly) return;
    addDCAConfig({
      id: uuid(),
      symbol: symbol.toUpperCase(),
      name,
      type: type as DCAConfig["type"],
      monthlyAmount: parseFloat(monthly),
      monthlyAmountCurrency: monthlyCurr,
      expectedAnnualReturn: parseFloat(annualReturn),
      years: parseInt(years),
      startDate,
    });
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New DCA Plan" className="max-w-md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          <Select label="Type" value={type} onChange={(e) => setType(e.target.value)} options={TYPE_OPTIONS} />
        </div>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="S&P 500 ETF" />
        <div className="grid grid-cols-2 gap-3">
          <MoneyInput
            label="Monthly Amount"
            value={monthly}
            onValueChange={setMonthly}
            currency={monthlyCurr}
            onCurrencyChange={setMonthlyCurr}
          />
          <Input label="Expected Annual Return" type="number" value={annualReturn} onChange={(e) => setAnnualReturn(e.target.value)} suffix="%" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Duration (years)" type="number" value={years} onChange={(e) => setYears(e.target.value)} />
          <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        {monthly && annualReturn && years && (
          <div className="bg-slate-700 rounded-lg p-3 text-sm space-y-1">
            {(() => {
              const { totalInvested, finalValue, totalGain } = buildDCAProjection({
                id: "", symbol, name, type: type as DCAConfig["type"],
                monthlyAmount: parseFloat(monthly) || 0,
                monthlyAmountCurrency: monthlyCurr,
                expectedAnnualReturn: parseFloat(annualReturn) || 0,
                years: parseInt(years) || 0, startDate,
              });
              return (
                <>
                  <div className="flex justify-between"><span className="text-slate-400">Total Invested</span><span>{format(totalInvested)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Final Value</span><span className="text-emerald-400 font-semibold">{format(finalValue)}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Total Gain</span><span className="text-blue-400">{format(totalGain)}</span></div>
                </>
              );
            })()}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={handleAdd} className="flex-1">Create Plan</Button>
        </div>
      </div>
    </Modal>
  );
}

export default function DCAPage() {
  const { dcaConfigs } = useStore();
  const [adding, setAdding] = useState(false);

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">DCA Projections</h1>
          <p className="text-slate-400 text-sm mt-1">
            Dollar Cost Averaging — project your wealth with regular investments
          </p>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} /> New Plan
        </Button>
      </div>

      {dcaConfigs.length === 0 ? (
        <Card className="text-center py-16">
          <TrendingUp size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 mb-3">No DCA plans yet</p>
          <p className="text-slate-500 text-sm mb-4">
            Create a plan to see how regular investments compound over time
          </p>
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} /> Create your first DCA plan
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {dcaConfigs.map((cfg) => <DCACard key={cfg.id} cfg={cfg} />)}
        </div>
      )}

      <AddDCAModal open={adding} onClose={() => setAdding(false)} />
    </div>
  );
}
