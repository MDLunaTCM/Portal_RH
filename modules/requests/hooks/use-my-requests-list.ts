"use client";

import { useState, useEffect, useCallback } from "react";
import { listMyRequests } from "../actions";

/**
 * Shape used by the unified requests list page (TASK-011).
 * Richer than DashboardRequest: includes typeCode for catalog icon lookup.
 */
export interface RequestListItem {
  id: string;
  /** Human-readable name from request_types.name */
  type: string;
  /** DB code from request_types.code — used to look up catalog icon */
  typeCode: string;
  /** Collapsed: draft/pending/cancelled → "pending" */
  status: "pending" | "approved" | "rejected";
  /** Formatted date string for display */
  date: string;
  /** Short description from notes or metadata */
  description: string;
}

function mapStatus(raw: string): RequestListItem["status"] {
  if (raw === "approved") return "approved";
  if (raw === "rejected") return "rejected";
  return "pending"; // draft | pending | cancelled
}

/**
 * Fetches all requests for the current employee (up to 100).
 *
 * Joins `request_types` for name + code (icon lookup via catalog).
 * RLS enforces that only the owner's rows are returned — `employee_id` filter
 * is redundant but kept as defence-in-depth.
 *
 * Returns `refetch` so the ErrorState retry button can re-trigger the query.
 */
export function useMyRequestsList(userId: string | null) {
  const [requests, setRequests] = useState<RequestListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    if (!userId) {
      setRequests([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      let timedOut = false;

      const timeoutId = window.setTimeout(() => {
        timedOut = true;
        if (process.env.NODE_ENV !== "production") {
          console.error("[useMyRequestsList] Timeout while loading requests", { userId });
        }
        if (!cancelled) {
          setError("La carga de solicitudes tardó demasiado. Verifica tu conexión e inténtalo de nuevo.");
          setIsLoading(false);
        }
      }, 12000);

      try {
        const { requests: data, error: fetchError } = await listMyRequests();

        if (cancelled || timedOut) return;

        if (fetchError) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[useMyRequestsList] Server action fetch error", {
              message: fetchError,
              userId,
            });
          }
          setError(fetchError);
          return;
        }

        const mapped: RequestListItem[] = (data ?? []).map((row) => {
          const meta = row.metadata;

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
          };
        });

        if (!cancelled) setRequests(mapped);
      } catch (err) {
        if (!cancelled && !timedOut) {
          if (process.env.NODE_ENV !== "production") {
            console.error("[useMyRequestsList] Unexpected error", err);
          }
          setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
        }
      } finally {
        window.clearTimeout(timeoutId);
        if (!cancelled && !timedOut) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId, version]);

  return { requests, isLoading, error, refetch };
}
