import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

/**
 * Supabase server client — use in Server Components, Server Actions,
 * and Route Handlers. Reads and writes session cookies via next/headers.
 *
 * Must be called as `await createClient()` because cookies() is async
 * in Next.js 16.
 *
 * @example
 * // Server Component
 * const supabase = await createClient();
 * const { data: { user } } = await supabase.auth.getUser();
 *
 * @example
 * // Server Action
 * "use server";
 * const supabase = await createClient();
 * await supabase.from("requests").insert({ ... });
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component — cookies cannot be
            // mutated there. This is expected; proxy.ts handles the refresh.
          }
        },
      },
    }
  );
}
