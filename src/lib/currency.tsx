"use client";
import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";
import { cache } from "./cache";

export type SupportedCurrency = "USD" | "THB";

export interface CurrencyContextValue {
  currency: SupportedCurrency;
  setCurrency: (c: SupportedCurrency) => void;
  /** Currency symbol for the current display currency. */
  symbol: string;
  /** USD → display currency multiplier. 1 when currency is USD. */
  usdRate: number;
  /** Format a monetary value in the display currency. */
  format: (amount: number) => string;
  /** Convert a USD amount to display currency. */
  fromUSD: (usd: number) => number;
  /** Convert a display-currency amount to USD (use before storing). */
  toUSD: (displayAmount: number) => number;
  /** Convert an amount from one stored currency to the display currency. */
  convertAmount: (amount: number, from: string, to: string) => number;
  loading: boolean;
  lastUpdated: string | null;
  refresh: () => void;
}

const RATE_CACHE_KEY = "exchange_rate:USD";
const RATE_CACHE_TTL = 60 * 60 * 1000; // 1 hour
const CURRENCY_PREF_KEY = "finance_currency";

const FORMATTERS: Record<SupportedCurrency, Intl.NumberFormat> = {
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }),
  THB: new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 2 }),
};

const SYMBOLS: Record<SupportedCurrency, string> = { USD: "$", THB: "฿" };

const CurrencyCtx = createContext<CurrencyContextValue>({
  currency: "USD",
  setCurrency: () => {},
  symbol: "$",
  usdRate: 1,
  format: (n) => FORMATTERS.USD.format(n),
  fromUSD: (n) => n,
  toUSD: (n) => n,
  convertAmount: (n) => n,
  loading: false,
  lastUpdated: null,
  refresh: () => {},
});

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, _setCurrency] = useState<SupportedCurrency>("USD");
  const [rates, setRates] = useState<Record<string, number>>({ USD: 1, THB: 33 });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(CURRENCY_PREF_KEY) as SupportedCurrency | null;
    if (saved === "USD" || saved === "THB") _setCurrency(saved);
  }, []);

  const fetchRates = useCallback(async () => {
    // Try cache first
    const cached = cache.get<{ rates: Record<string, number>; lastUpdated: string }>(RATE_CACHE_KEY);
    if (cached) {
      setRates(cached.rates);
      setLastUpdated(cached.lastUpdated);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/exchange-rate?base=USD");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setRates(data.rates);
      setLastUpdated(data.lastUpdated);
      cache.set(RATE_CACHE_KEY, { rates: data.rates, lastUpdated: data.lastUpdated }, RATE_CACHE_TTL);
    } catch {
      // Keep default rates
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const setCurrency = useCallback((c: SupportedCurrency) => {
    _setCurrency(c);
    localStorage.setItem(CURRENCY_PREF_KEY, c);
  }, []);

  const usdToDisplay = currency === "USD" ? 1 : (rates["THB"] ?? 33);

  const format = useCallback(
    (amount: number) => FORMATTERS[currency].format(amount),
    [currency]
  );

  const fromUSD = useCallback(
    (usd: number) => usd * usdToDisplay,
    [usdToDisplay]
  );

  const toUSD = useCallback(
    (displayAmount: number) => displayAmount / usdToDisplay,
    [usdToDisplay]
  );

  const convertAmount = useCallback((amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const thbPerUsd = rates["THB"] ?? 33;
    if (from === "USD" && to === "THB") return amount * thbPerUsd;
    if (from === "THB" && to === "USD") return amount / thbPerUsd;
    return amount;
  }, [rates]);

  return (
    <CurrencyCtx.Provider value={{
      currency,
      setCurrency,
      symbol: SYMBOLS[currency],
      usdRate: usdToDisplay,
      format,
      fromUSD,
      toUSD,
      convertAmount,
      loading,
      lastUpdated,
      refresh: fetchRates,
    }}>
      {children}
    </CurrencyCtx.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyCtx);
}

/** Convenience: format using current currency context. */
export function useMoney() {
  const { format } = useCurrency();
  return format;
}
