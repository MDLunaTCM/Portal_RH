import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Supabase admin client — uses the SERVICE_ROLE key.
 *
 * The service role BYPASSES Row Level Security entirely.
 * Use ONLY in trusted server-side contexts:
 *   - Server Actions that write audit_logs (TASK-026)
 *   - Scheduled jobs / background operations
 *   - Admin data migrations
 *
 * NEVER import this in Client Components or expose the
 * SUPABASE_SERVICE_ROLE_KEY to the browser.
 *
 * @example
 * // In a Server Action
 * "use server";
 * const supabase = createAdminClient();
 * await supabase.from("audit_logs").insert({ ... });
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
        "Set both in your .env.local file. The service role key is available " +
        "in the Supabase dashboard under Settings → API → service_role."
    );
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      // Disable cookie-based session management — the admin client is
      // stateless (no user session needed; service role is the credential).
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
