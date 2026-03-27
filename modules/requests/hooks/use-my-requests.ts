"use client";

import { useState, useEffect } from "react";
import { listMyRequestsWidget } from "@/modules/requests/actions";
import type { RequestStatusEnum } from "@/types/database";

/**
 * Shape expected by the PendingRequests widget in components/dashboard/widgets.tsx.
 */
export interface DashboardRequest {
  id: string;
  /** Derived from `request_types.name` via foreign-key join */
  type: string;
  /** Collapsed: draft/pending/cancelled → "pending" */
  status: "pending" | "approved" | "rejected";
  /** Formatted date string for display */
  date: string;
  /** Short description derived from `notes` or `metadata` */
  description: string;
}

function mapStatus(
  raw: RequestStatusEnum,
): DashboardRequest["status"] {
  if (raw === "approved") return "approved";
  if (raw === "rejected") return "rejected";
  return "pending"; // draft | pending | cancelled
}

/**
 * Fetches the current employee's most recent requests.
 * Delegates to the `listMyRequestsWidget` server action to avoid
 * browser-client session timing issues.
 *
 * @param userId  The auth.uid() of the logged-in user (null while loading)
 * @param limit   Max rows to return (default 5)
 */
export function useMyRequests(userId: string | null, limit = 5) {
  const [requests, setRequests] = useState<DashboardRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    let cancelled = false;

    const fetchData = async () => {
      try {
        const { rows, error: fetchError } = await listMyRequestsWidget(limit);

        if (cancelled) return;

        if (fetchError) {
          setError(fetchError);
          return;
        }

        const mapped: DashboardRequest[] = rows.map((row) => {
          const meta = row.metadata as Record<string, unknown> | null;
          const description =
            row.notes ??
            (meta?.details as string | undefined) ??
            (meta?.purpose as string | undefined) ??
            "";

          return {
            id: row.id,
            type: row.request_type_name ?? "Solicitud",
            status: mapStatus(row.status as RequestStatusEnum),
            date: new Date(row.created_at).toLocaleDateString("es-MX", {
              day: "numeric",
              month: "short",
              year: "numeric",
            }),
            description,
          };
        });

        if (!cancelled) setRequests(mapped);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar solicitudes");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [userId, limit]);

  return { requests, isLoading, error };
}
