import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * proxy.ts — Next.js 16 replacement for middleware.ts
 *
 * Responsibilities:
 * 1. Refresh the Supabase session cookie on every request so it never expires.
 * 2. (TASK-004) Redirect unauthenticated users away from protected routes.
 * 3. (TASK-005) Redirect authenticated users away from auth routes (/login, etc.).
 *
 * IMPORTANT: Do not add logic between createServerClient and supabase.auth.getUser().
 * Any code in between can cause subtle session bugs.
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Propagate new cookie values to the outgoing request object
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Rebuild the response so Set-Cookie headers are included
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do NOT remove or move this call.
  // It keeps the session alive and detects expiry.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // -----------------------------------------------------------------------
  // Route protection (TASK-004)
  // -----------------------------------------------------------------------

  const { pathname } = request.nextUrl;

  // Routes that do not require authentication
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/set-password") ||
    pathname.startsWith("/auth/callback");

  if (!user && !isAuthRoute) {
    // Unauthenticated → redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    // Already authenticated → redirect away from login page
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static  (static assets)
     * - _next/image   (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     * - image files (svg, png, jpg, jpeg, gif, webp, ico)
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
