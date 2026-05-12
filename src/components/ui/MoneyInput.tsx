"use client";
import Input from "./Input";
import type { SupportedCurrency } from "@/lib/currency";

const SYMBOLS: Record<string, string> = { USD: "$", THB: "฿" };
const CURRENCIES: SupportedCurrency[] = ["USD", "THB"];

interface MoneyInputProps {
  label: string;
  value: string | number;
  onValueChange: (v: string) => void;
  currency: string;
  onCurrencyChange: (c: string) => void;
  placeholder?: string;
  className?: string;
}

export default function MoneyInput({ label, value, onValueChange, currency, onCurrencyChange, placeholder, className }: MoneyInputProps) {
  return (
    <div className={className}>
      <label className="text-xs font-medium text-slate-400 block mb-1">{label}</label>
      <div className="flex gap-1.5 items-start">
        <div className="flex-1">
          <Input
            type="number"
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            prefix={SYMBOLS[currency] ?? currency}
            placeholder={placeholder ?? "0.00"}
          />
        </div>
        <select
          value={currency}
          onChange={(e) => onCurrencyChange(e.target.value)}
          className="h-[38px] px-2 bg-slate-700 border border-slate-600 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
    </div>
  );
}
