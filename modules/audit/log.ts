import { createAdminClient } from "@/lib/supabase/admin";
import type { AuditActionEnum, Json } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditEntry {
  /** auth.uid() of the user performing the action — always set server-side */
  actor_id: string;
  /** One of the AuditActionEnum values */
  action: AuditActionEnum;
  /**
   * Logical resource name.
   * Convention: singular snake_case matching the table name without prefix.
   *   "request" | "employee_document" | "announcement" | "policy"
   */
  resource: string;
  /** UUID of the affected record. Optional (e.g. bulk operations). */
  resource_id?: string | null;
  /**
   * Action-specific context. Keep payloads minimal and non-sensitive:
   * - No passwords, tokens, or PII beyond what is necessary for the audit.
   * - Include human-readable labels (type, title, category) so the log is
   *   useful without cross-referencing other tables.
   */
  metadata?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// writeAuditLog
// ---------------------------------------------------------------------------

/**
 * Fire-and-forget audit log writer.
 *
 * Uses the Supabase service-role client (`createAdminClient`) which bypasses
 * RLS — necessary because the `audit_logs` table has no INSERT policy for the
 * authenticated role (preventing users from forging their own log entries).
 *
 * Design rules:
 *  - NEVER throws — errors are silently swallowed so the main operation is
 *    never blocked or failed because of an audit failure.
 *  - ALWAYS call this after the main operation succeeds, not before.
 *  - Do NOT include secrets, full file contents, or sensitive PII in metadata.
 *  - Keep metadata flat (one level) for easy rendering in the audit viewer.
 *
 * @example
 * // In a server action, after a successful DB operation:
 * await writeAuditLog({
 *   actor_id: user.id,
 *   action: "approve",
 *   resource: "request",
 *   resource_id: requestId,
 *   metadata: { request_type: "vacaciones", employee_id: employeeId },
 * });
 */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();

    await supabase.from("audit_logs").insert({
      actor_id: entry.actor_id,
      action: entry.action,
      resource: entry.resource,
      resource_id: entry.resource_id ?? null,
      metadata: (entry.metadata ?? {}) as Json,
    });
  } catch {
    // Intentionally swallowed — audit logging must never break primary flows.
    // In production, consider piping this to a monitoring service instead.
  }
}
