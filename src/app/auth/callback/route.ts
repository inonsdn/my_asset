import { NextRequest, NextResponse } from "next/server";

// Supabase JS v2 with detectSessionInUrl:true handles the PKCE exchange
// automatically in the browser. This route just cleans the URL and redirects.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/profile";
  // Let the client pick up the code/token from URL params on next render
  return NextResponse.redirect(`${origin}${next}`);
}
