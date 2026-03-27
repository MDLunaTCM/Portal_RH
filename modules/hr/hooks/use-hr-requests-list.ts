"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { listHRRequests } from "@/modules/hr/actions";
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HRRequestListItem {
  id: string;
  type: string;
  typeCode: string;
  status: "pending" | "approved" | "rejected";
  date: string;
  description: string;
  employee: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
  reviewed_at: string | null;
}

export interface HRRequestFilters {
  /** Server-side: filter by DB status. Empty string = all. */
  status: "" | "pending" | "approved" | "rejected";
  /** Server-side: ISO date strings */
  date_from: string;
  date_to: string;
  /** Client-side: match against request_types.code */
  typeCode: string;
  /** Client-side: match against employee name or request type name */
  search: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mapStatus(raw: string): HRRequestListItem["status"] {
  if (raw === "approved") return "approved";
  if (raw === "rejected") return "rejected";
  return "pending";
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches all requests for the HR inbox.
 * Delegates server-side filters (status, date) to the `listHRRequests` server action.
 * Client-side filters (typeCode, search) are applied via useMemo.
 */
export function useHRRequestsList(filters: HRRequestFilters) {
  const [rawRequests, setRawRequests] = useState<HRRequestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  const { status, date_from, date_to } = filters;

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { requests: rows, error: fetchError } = await listHRRequests({
          status,
          date_from,
          date_to,
        });

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          setIsLoading(false);
          return;
        }

        const mapped: HRRequestListItem[] = rows.map((row) => {
          const employeeName =
            row.employee_first_name && row.employee_last_name
              ? `${row.employee_first_name} ${row.employee_last_name}`
              : "Colaborador";

          const meta = row.metadata as Record<string, unknown> | null;

          return {
            id: row.id,
            type: row.request_type_name ?? "Solicitud",
            typeCode: row.request_type_code ?? "",
            status: mapStatus(row.status),
            date: new Date(row.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            description:
              row.notes ??
              (meta?.details as string | undefined) ??
              (meta?.purpose as string | undefined) ??
              "",
            employee: {
              id: row.employee_id ?? "",
              name: employeeName,
              avatar_url: row.employee_avatar_url,
            },
            reviewed_at: row.reviewed_at,
          };
        });

        if (!cancelled) {
          setRawRequests(mapped);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, date_from, date_to, version]);

  // Client-side filtering for typeCode and search
  const requests = useMemo(() => {
    let result = rawRequests;

    if (filters.typeCode) {
      result = result.filter((r) => r.typeCode === filters.typeCode);
    }

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.employee.name.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q),
      );
    }

    return result;
  }, [rawRequests, filters.typeCode, filters.search]);

  return { requests, isLoading, error, refetch };
}
