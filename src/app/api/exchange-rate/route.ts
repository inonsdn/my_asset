import { NextRequest, NextResponse } from "next/server";

// open.er-api.com — completely free, no key required, updates hourly
const BASE_URL = "https://open.er-api.com/v6/latest";

export async function GET(req: NextRequest) {
  const base = (req.nextUrl.searchParams.get("base") ?? "USD").toUpperCase();
  try {
    const res = await fetch(`${BASE_URL}/${base}`, {
      next: { revalidate: 3600 }, // cache 1 hour on the server
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();

    return NextResponse.json(
      {
        base: data.base_code as string,
        rates: data.rates as Record<string, number>,
        lastUpdated: data.time_last_update_utc as string,
      },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
