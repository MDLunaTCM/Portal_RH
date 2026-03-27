"use client";

import { useState, useEffect, useCallback } from "react";
import { listAuditLog } from "@/modules/audit/actions";
import type { AuditActionEnum } from "@/types/database";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  /** Derived from profiles join — falls back to actorId short form or "Sistema" */
  actorName: string;
  action: AuditActionEnum;
  resource: string;
  resourceId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface AuditLogFilters {
  /** Server-side: filter by action. Empty = all. */
  action: "" | AuditActionEnum;
  /** Server-side: filter by resource name. Empty = all. */
  resource: string;
  /** Server-side: ISO date lower bound (inclusive). */
  date_from: string;
  /** Server-side: ISO date upper bound (inclusive). */
  date_to: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches audit log entries for the super_admin audit viewer page (TASK-026).
 * Delegates to the `listAuditLog` server action to avoid
 * browser-client session timing issues.
 *
 * RLS `audit_logs_superadmin_select` restricts reads to super_admin.
 */
export function useAuditLog(filters: AuditLogFilters) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { entries: rows, error: fetchError } = await listAuditLog(filters);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const mapped: AuditLogEntry[] = rows.map((row) => {
          const actorName =
            row.actor_first_name && row.actor_last_name
              ? `${row.actor_first_name} ${row.actor_last_name}`
              : row.actor_id
              ? `${row.actor_id.slice(0, 8)}…`
              : "Sistema";

          return {
            id: row.id,
            actorId: row.actor_id,
            actorName,
            action: row.action as AuditActionEnum,
            resource: row.resource,
            resourceId: row.resource_id,
            metadata: row.metadata,
            createdAt: row.created_at,
          };
        });

        if (!cancelled) {
          setEntries(mapped);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar audit log");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.resource, filters.date_from, filters.date_to, version]);

  return { entries, isLoading, error, refetch };
}
