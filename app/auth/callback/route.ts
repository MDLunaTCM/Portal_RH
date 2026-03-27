import { createClient } from "@/lib/supabase/server";
import { NextResponse, type NextRequest } from "next/server";

/**
 * /auth/callback — PKCE code-exchange endpoint.
 *
 * Supabase redirects here after:
 *   1. Password-reset emails (next=/set-password)
 *   2. Magic-link / invite emails (next=/dashboard)
 *
 * Flow:
 *   Email link → /auth/callback?code=<pkce_code>&next=<path>
 *   → Exchange code for session (sets cookies via createClient)
 *   → Redirect to `next`
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const safeNext = next.startsWith("/") ? next : "/dashboard";

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    // Code exchange failed (expired, already used, or PKCE mismatch)
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  if (tokenHash && (type === "invite" || type === "recovery" || type === "email_change")) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
    // Token expired or already used
    return NextResponse.redirect(`${origin}/login?error=link_expired`);
  }

  // No code or token_hash present
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
