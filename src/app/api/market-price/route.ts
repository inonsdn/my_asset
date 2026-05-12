import { NextRequest, NextResponse } from "next/server";

// Uses Yahoo Finance unofficial API (no key required) and metals-api for gold
async function fetchYahooPrice(symbol: string) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status}`);
  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error("No data");
  const meta = result.meta;
  const price: number = meta.regularMarketPrice ?? meta.chartPreviousClose ?? 0;
  const prevClose: number = meta.previousClose ?? meta.chartPreviousClose ?? price;
  const change = price - prevClose;
  const changePercent = prevClose !== 0 ? (change / prevClose) * 100 : 0;
  return {
    symbol: (meta.symbol ?? symbol) as string,
    price,
    change,
    changePercent,
    currency: (meta.currency ?? "USD") as string,
    lastUpdated: new Date().toISOString(),
  };
}

async function fetchGoldPrice() {
  // Use a free gold price API
  const res = await fetch("https://www.goldapi.io/api/XAU/USD", {
    headers: { "x-access-token": "goldapi-demo", "Content-Type": "application/json" },
    next: { revalidate: 300 },
  });
  // Fallback to Yahoo Finance gold futures if goldapi fails
  if (!res.ok) {
    return fetchYahooPrice("GC=F");
  }
  const data = await res.json();
  return {
    symbol: "XAUUSD",
    price: (data.price ?? 0) as number,
    change: (data.ch ?? 0) as number,
    changePercent: (data.chp ?? 0) as number,
    currency: "USD",
    lastUpdated: new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol");
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }

  try {
    let data;
    if (symbol.toUpperCase() === "XAUUSD" || symbol.toUpperCase() === "GOLD") {
      data = await fetchGoldPrice();
    } else {
      data = await fetchYahooPrice(symbol);
    }
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
