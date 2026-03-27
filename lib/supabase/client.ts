import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";

/**
 * Supabase browser client — use in Client Components ('use client').
 * Call this function inside your component, not at module level,
 * so each render gets a fresh client with current cookies.
 *
 * @example
 * const supabase = createClient();
 * const { data } = await supabase.from("profiles").select("*");
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
