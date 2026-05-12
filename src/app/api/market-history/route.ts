import { NextRequest, NextResponse } from "next/server";

const RANGE_MAP: Record<string, string> = {
  "1W": "5d",
  "1M": "1mo",
  "3M": "3mo",
  "6M": "6mo",
  "1Y": "1y",
  "All": "5y",
};

interface OHLCVPoint {
  date: string;
  close: number;
}

async function fetchSymbolHistory(symbol: string, range: string): Promise<OHLCVPoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${range}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance returned ${res.status} for ${symbol}`);
  const data = await res.json();

  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);

  const timestamps: number[] = result.timestamp ?? [];
  const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];

  return timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      close: closes[i],
    }))
    .filter((p) => p.close != null && isFinite(p.close));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbolsParam = searchParams.get("symbols") ?? "";
  const rangeParam = searchParams.get("range") ?? "1M";

  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json({});
  }

  const yahooRange = RANGE_MAP[rangeParam] ?? "1mo";

  const results = await Promise.allSettled(
    symbols.map(async (sym) => {
      const history = await fetchSymbolHistory(sym, yahooRange);
      return { sym, history };
    })
  );

  const output: Record<string, OHLCVPoint[]> = {};
  for (const r of results) {
    if (r.status === "fulfilled") {
      output[r.value.sym] = r.value.history;
    }
    // skip failed symbols
  }

  return NextResponse.json(output);
}
