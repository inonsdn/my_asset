"use client";
import { useState, useEffect, useCallback } from "react";
import type { MarketPrice } from "@/lib/types";

export function useMarketPrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, MarketPrice>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = useCallback(async () => {
    if (symbols.length === 0) return;
    setLoading(true);
    setError(null);
    const results: Record<string, MarketPrice> = {};
    await Promise.allSettled(
      symbols.map(async (sym) => {
        try {
          const res = await fetch(`/api/market-price?symbol=${encodeURIComponent(sym)}`);
          if (res.ok) {
            results[sym] = await res.json();
          }
        } catch {
          // ignore individual failures
        }
      })
    );
    setPrices(results);
    setLoading(false);
  }, [symbols.join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  return { prices, loading, error, refetch: fetchPrices };
}

export function useSinglePrice(symbol: string | null) {
  const [price, setPrice] = useState<MarketPrice | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch_ = useCallback(async () => {
    if (!symbol) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/market-price?symbol=${encodeURIComponent(symbol)}`);
      if (res.ok) setPrice(await res.json());
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => { fetch_(); }, [fetch_]);

  return { price, loading, refetch: fetch_ };
}
