"use server";

import { createClient } from "@/lib/supabase/server";
import type { AuditActionEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogFiltersInput {
  action: "" | AuditActionEnum;
  resource: string;
  date_from: string;
  date_to: string;
}

export interface AuditLogRow {
  id: string;
  actor_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_first_name: string | null;
  actor_last_name: string | null;
}

export interface ListAuditLogResult {
  entries: AuditLogRow[];
  error: string | null;
}

type AuditRow = {
  id: string;
  actor_id: string | null;
  action: string;
  resource: string;
  resource_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  profiles: { first_name: string; last_name: string } | null;
};

// ---------------------------------------------------------------------------
// List audit log entries
// ---------------------------------------------------------------------------

/**
 * Fetches audit log entries for the super_admin audit viewer.
 * Server-side equivalent of the browser-client query in use-audit-log.ts.
 *
 * RLS `audit_logs_superadmin_select` restricts reads to super_admin.
 * If a non-super_admin calls this, Supabase returns an empty array (not an error).
 */
export async function listAuditLog(
  filters: AuditLogFiltersInput,
): Promise<ListAuditLogResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { entries: [], error: "No autenticado." };
  }

  let query = supabase
    .from("audit_logs")
    .select(
      "id, actor_id, action, resource, resource_id, metadata, created_at, profiles!actor_id(first_name, last_name)",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (filters.action) {
    query = query.eq("action", filters.action);
  }
  if (filters.resource) {
    query = query.eq("resource", filters.resource);
  }
  if (filters.date_from) {
    query = query.gte("created_at", filters.date_from);
  }
  if (filters.date_to) {
    const dayAfter = new Date(filters.date_to);
    dayAfter.setDate(dayAfter.getDate() + 1);
    query = query.lt("created_at", dayAfter.toISOString());
  }

  const { data, error } = await query;
  if (error) return { entries: [], error: error.message };

  return {
    entries: ((data ?? []) as AuditRow[]).map((row) => ({
      id: row.id,
      actor_id: row.actor_id,
      action: row.action,
      resource: row.resource,
      resource_id: row.resource_id,
      metadata: row.metadata ?? {},
      created_at: row.created_at,
      actor_first_name: row.profiles?.first_name ?? null,
      actor_last_name: row.profiles?.last_name ?? null,
    })),
    error: null,
  };
}
