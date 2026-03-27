"use client";

import { useState, useEffect, useCallback } from "react";
import { listHRPendingRequests } from "@/modules/hr/actions";
import type { DashboardRequest } from "@/modules/requests/hooks/use-my-requests";

/**
 * Fetches all pending requests across every employee for the HR inbox widget.
 * Delegates to the `listHRPendingRequests` server action to avoid
 * browser-client session timing issues.
 *
 * RLS `requests_hr_select` allows hr_admin / super_admin to read all rows.
 *
 * @param limit  Max rows (default 8)
 */
export function useHRPendingRequests(limit = 8) {
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const { requests: rows, error: fetchError } = await listHRPendingRequests(limit);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const mapped: DashboardRequest[] = rows.map((row) => {
          const employeeName =
            row.employee_first_name && row.employee_last_name
              ? `${row.employee_first_name} ${row.employee_last_name}`
              : "";

          const meta = row.metadata as Record<string, unknown> | null;
          const description =
            employeeName ||
            row.notes ||
            (meta?.details as string | undefined) ||
            "";

          return {
            id: row.id,
            type: row.request_type_name ?? "Solicitud",
            status: "pending" as const,
            date: new Date(row.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            description,
          };
        });

        if (!cancelled) {
          setRequests(mapped);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [limit, version]);

  return { requests, isLoading, error, refetch };
}
