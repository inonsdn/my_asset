import { NextRequest, NextResponse } from "next/server";

// Supabase PKCE flow: after Google auth, Supabase appends ?code=xxx here.
// We MUST forward the code to a client-rendered page so detectSessionInUrl:true
// can exchange it for a session. Stripping the code breaks the sign-in.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  const redirectUrl = new URL(next, url.origin);
  if (code) redirectUrl.searchParams.set("code", code);

  return NextResponse.redirect(redirectUrl.toString());
}
